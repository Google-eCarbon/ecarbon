from typing import Dict, Any, List
from resources_loader import InputGuidelineLoader, ResourceLoader
from resources_loader import InputTestSuiteHtmlLoader
from chunker import GuidelineChunker
from html_parser import HTMLParser
from html_chunker import HTMLChunker
import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from config.firebase_config import initialize_firebase
import json
from datetime import datetime
from pathlib import Path
from vectordb_manager import VectorDBManager
from resources_loader import InputTestSuiteHtmlLoader
from resources_loader import InputGuidelineLoader
from wsg_evaluator import WSGEvaluator, EvaluationResult
from firebase_admin import firestore

def init_firestore():
    """Firestore 초기화"""
    db = initialize_firebase()
    return db

def evaluate_with_llm(db, test_result_id: str, html_content: str, guideline_content: str, test_file_title: str, model_name='gemini-1.5-flash', case_1=False):
    """LLM을 사용하여 HTML 코드와 가이드라인을 평가"""
    try:
        # WSGEvaluator 사용하여 평가
        evaluator = WSGEvaluator()
        result = evaluator.evaluate_code(html_content, guideline_content, model_name)
        
        if case_1:
            # Firestore에 평가 결과 저장
            llm_evaluation_ref = db.collection('llm_evaluations').document()
            
            # 위반 사항이 있는 경우
            violations = result.violations
            violation_text = ""
            explanation = ""
            corrected_code = ""
            
            if violations:
                violation = violations[0]  # 처음 발견된 위반 사항
                violation_text = "위반 사항 발견"
                explanation = violation.get('description', '')
                corrected_code = violation.get('suggestion', '')
            
            llm_evaluation_ref.set({
                'test_result_id': test_result_id,
                'model': model_name,
                'test_file_title': test_file_title,
                'score': result.score,
                'guideline_id': result.guideline_id,
                'violation': violation_text,
                'explanation': explanation,
                'corrected_code': corrected_code,
                'created_at': firestore.SERVER_TIMESTAMP
            })
            print(f"[OK] Firestore에 LLM 평가 결과 저장 완료 (ID: {llm_evaluation_ref.id})")
        return True
    except Exception as e:
        print(f"LLM 평가 중 오류 발생: {str(e)}")
        return False

async def evaluate_test_suite(url: str = None):
    """입력 받은 URL 을 평가합니다. """
    # 데이터베이스 연결
    print("\n[1/5] Connecting to database...")
    db = init_firestore()
    print("[OK] Database connection successful")
    
    # 벡터 DB 초기화 및 사용
    print("\n[2/5] 가이드라인 데이터 처리 중...")
    
    # 이미 생성된 벡터 데이터베이스가 있는지 확인
    index_id = "unified_guidelines_index"
    vector_db_exists = VectorDBManager.check_index_exists(index_id=index_id)
    print(f"Vector DB 존재 여부 확인: {vector_db_exists}")
    
    # 통합 버전 Vector Search 초기화
    print("\n[3/5] Vector Search 초기화 중...")
    unified_db = VectorDBManager.create_unified_db(index_id=index_id)
    print("[OK] Vector Search initialized")
    
    # 벡터 데이터베이스가 없는 경우에만 처음부터 생성
    if not vector_db_exists:
        print("\n처음 실행 또는 벡터 데이터베이스 없음 - 가이드라인 데이터 로드 중...")
        loader = InputGuidelineLoader("../../data/wsg_guidelines.json")
        guideline_json = loader.load_all()
        print(f"[OK] Guidelines loaded (categories: {len(guideline_json)})")
        
        print("\nChunking started...")
        chunker = GuidelineChunker(guideline_json)
        unified_chunks = chunker.chunk_unified()
        print(f"[OK] Chunking complete (unified chunks: {len(unified_chunks)})")
        
        print("\nChunk embedding and storage in progress...")
        unified_db.add_unified_chunks(unified_chunks)
        print("[OK] Chunk embedding and storage complete")
    else:
        print("\n이미 생성된 벡터 데이터베이스 사용 중")
    # HTML 파일 처리
    print("\n[4/5] Processing HTML file...")
    # TODO: 입력받은 url 의 html 파일을 로드한다. 
    # 1. 웹사이트 리소스 로드
    resource_loader = ResourceLoader()
    site_resource = await resource_loader.load_website_content(url)
            
    # 2. HTML 구조 분석
    html_parser = HTMLParser()
    # structure_data = html_parser.extract_page_structure(site_resource.raw_html)
            
    # 3. HTML 청킹
    html_chunker = HTMLChunker()
    chunked_html = html_chunker.chunk_html(site_resource.raw_html)
    print(f"HTML 청킹 완료: {len(chunked_html)} 청크 생성")
    for chunk in chunked_html:
        print(f"\n처리 중: {chunk['chunk_type']}")

        print("가이드라인 유사도 검색 중...")
        similar_guidelines = unified_db.search_similar(chunk, k=1) # top 3 찾고, llm에게 물어보기 
        
        if similar_guidelines:
            guideline = similar_guidelines[0]
            print(f"✓ 매칭된 가이드라인:")
            print(f"  - 제목: {guideline['title']}")
            print(f"  - 카테고리: {guideline['category_name']}")
            print(f"  - 유사도: {guideline['score']:.4f}")
            
            # Firestore에 테스트 결과 저장
            print("\nFirestore에 데이터 저장 중...")
            
            # 테스트 결과 문서 생성
            test_results_ref = db.collection('audited_websites').document()
            test_result_id = test_results_ref.id
            
            # 테스트 결과 저장
            test_results_ref.set({
                'url': url,
                'chunk_type': chunk['chunk_type'],
                'html_content': chunk['text'],
                'created_at': firestore.SERVER_TIMESTAMP
            })
            
            # 가이드라인 정보 저장
            guideline_ref = db.collection('audited_websites').document(test_result_id).collection('guidelines').document()
            guideline_ref.set({
                'guideline_id': guideline['guideline_id'],
                'title': guideline['title'],
                'category_name': guideline['category_name'],
                'content': guideline['content'],
                'score': guideline['score'],
                'created_at': firestore.SERVER_TIMESTAMP
            })
            
            print(f"[OK] Firestore 저장 완료 (ID: {test_result_id})")
        else:
            print("[ERROR] 매칭되는 가이드라인을 찾지 못했습니다")
    
    # LLM 평가 수행
    print("\n[5/5] LLM 평가 시작...")
    
    try:
        # HTML 청크를 테스트 파일로 사용
        test_files = []
        for i, chunk in enumerate(chunked_html):
            test_files.append({
                'id': f'chunk_{i}',
                'file': f'chunk_{i}.html',
                'html_content': chunk['text'],
                'chunk_type': chunk['chunk_type'],
                'guideline_content': ''
            })
        
        total_files = len(test_files)
        print(f"평가할 HTML 청크 수: {total_files}")
        
        for i, test_file in enumerate(test_files, 1):
            print(f"\n[{i}/{total_files}] 청크: {test_file['file']} (유형: {test_file['chunk_type']})")
            print("-" * 30)
            
            try:
                # 가이드라인 내용 추가
                guideline_content = ""
                if similar_guidelines:
                    guideline = similar_guidelines[0]
                    test_file['guideline_content'] = guideline['content']
                    guideline_content = guideline['content']
                else:
                    test_file['guideline_content'] = ""
                
                print("LLM에 전달하는 데이터:")
                print(f"- HTML 크기: {len(test_file['html_content'])} bytes")
                print(f"- 가이드라인 크기: {len(test_file['guideline_content'])} bytes")
            except Exception as e:
                print(f"[ERROR] 가이드라인 처리 중 오류 발생: {e}")
                
            # LLM 평가 함수 호출
            try:
                success = evaluate_with_llm(
                    db,  # Firestore 데이터베이스 객체 전달
                    test_file['id'],
                    test_file['html_content'],
                    test_file['guideline_content'],
                    test_file['file'],  # 파일명 전달
                    'gemini-1.5-flash',
                    case_1=True
                )
            except Exception as e:
                print(f"[ERROR] 청크 처리 중 오류 발생: {e}")
                print(f"상세 정보: {e.args}")
        
        print("\n" + "="*50)
        print("테스트 스위트 평가 완료")
        print(f"총 처리 파일: {total_files}")
        print("="*50)
    except Exception as e:
        print(f"[ERROR] LLM 평가 중 오류 발생: {e}")
        
        # Firestore는 명시적으로 close할 필요 없음
    
    # Firestore는 명시적으로 close할 필요 없음

if __name__ == "__main__":
    import asyncio
    # 예시 URL로 테스트
    example_url = "https://example.com"
    asyncio.run(evaluate_test_suite(example_url))