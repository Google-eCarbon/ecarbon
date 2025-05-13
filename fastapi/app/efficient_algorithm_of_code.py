from services.input_loader import InputGuidelineLoader
from utils.chunker import GuidelineChunker
from services.vector_db_manager import VectorDBManager
from services.evaluator import evaluate_code, EvaluationResult
import os
import sqlite3
import json
from datetime import datetime
from pathlib import Path
from services.resources_loader import InputGuidelineLoader, ResourceLoader
from services.gemini_client import GeminiClient
import requests
from bs4 import BeautifulSoup

def init_database():
    """SQLite 데이터베이스 초기화"""
    conn = sqlite3.connect('evaluation.db')
    c = conn.cursor()
    
    # Drop existing tables if they exist
    c.execute('DROP TABLE IF EXISTS case_1_llm_evaluation')
    c.execute('DROP TABLE IF EXISTS guideline_chunks')
    c.execute('DROP TABLE IF EXISTS similar_guidelines')
    c.execute('DROP TABLE IF EXISTS unified_guidelines')
    c.execute('DROP TABLE IF EXISTS case_1_test_results')
    
    # 테스트 결과 테이블
    c.execute('''CREATE TABLE IF NOT EXISTS case_1_test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_file TEXT,
        html_content TEXT,
        created_at TIMESTAMP
    )''')
    
    # 유사 가이드라인 테이블 (통합 버전)
    c.execute('''CREATE TABLE IF NOT EXISTS unified_guidelines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_1_test_results_id INTEGER,
        guideline_id TEXT,
        title TEXT,
        category_name TEXT,
        url TEXT,
        similarity_score REAL,
        content TEXT,
        FOREIGN KEY (case_1_test_results_id) REFERENCES case_1_test_results (id)
    )''')
    
    # 유사 가이드라인 테이블 (부분 버전)
    c.execute('''CREATE TABLE IF NOT EXISTS similar_guidelines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_1_test_results_id INTEGER,
        guideline_id TEXT,
        title TEXT,
        category_name TEXT,
        url TEXT,
        similarity_score REAL,
        FOREIGN KEY (case_1_test_results_id) REFERENCES case_1_test_results (id)
    )''')
    
    # 가이드라인 청크 테이블
    c.execute('''CREATE TABLE IF NOT EXISTS guideline_chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        similar_guideline_id INTEGER,
        chunk_type TEXT,
        content TEXT,
        score REAL,
        FOREIGN KEY (similar_guideline_id) REFERENCES similar_guidelines (id)
    )''')
    
    # LLM 평가 결과 테이블
    c.execute('''CREATE TABLE IF NOT EXISTS case_1_llm_evaluation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_1_test_results_id INTEGER,
        model TEXT,
        test_file_title TEXT,
        relevant_code TEXT,
        violation TEXT,
        explanation TEXT,
        corrected_code TEXT,
        FOREIGN KEY (case_1_test_results_id) REFERENCES case_1_test_results (id)
    )''')
    
    conn.commit()
    return conn

def evaluate_with_llm(conn, test_result_id: int, html_content: str, guideline_content: str, test_file_title: str, model_name='gemini-1.5-flash'):
    """LLM을 사용하여 HTML 코드와 가이드라인을 평가"""
    try:
        result = evaluate_code(html_content, guideline_content, model_name, use_google=True)
        
        # 평가 결과 저장
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO case_1_llm_evaluation 
        (case_1_test_results_id, model, test_file_title, relevant_code, violation, explanation, corrected_code)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            test_result_id,
            model_name,
            test_file_title,
            result.relevant_code,
            result.violation,
            result.explanation,
            result.corrected_code
        ))
        conn.commit()
        return True
    except Exception as e:
        print(f"LLM 평가 중 오류 발생: {str(e)}")
        return False

def evaluate_url():
    # 데이터베이스 연결
    print("\n[1/5] 데이터베이스 연결 중...")
    conn = sqlite3.connect('evaluation.db')
    cursor = conn.cursor()
    print("✓ 데이터베이스 연결 완료")
    
    # 벡터 DB 초기화
    print("\n[2/5] 가이드라인 데이터 로드 중...")
    loader = InputGuidelineLoader("data/wsg_guidelines.json")
    guideline_json = loader.load_all()
    print(f"✓ 가이드라인 로드 완료 (카테고리 수: {len(guideline_json)})")
    
    print("\n청킹 시작...")
    chunker = GuidelineChunker(guideline_json)
    unified_chunks = chunker.chunk_unified()
    print(f"✓ 청킹 완료 (통합 청크 수: {len(unified_chunks)})")
    
    # 통합 버전 벡터 DB 초기화
    print("\n[3/5] 벡터 DB 초기화 중...")
    unified_db = VectorDBManager.create_unified_db(persist_dir="unified_db")
    print("✓ 벡터 DB 불러오기 완료")
    print("\n청크 임베딩 및 저장 중...")
    unified_db.add_unified_chunks(unified_chunks)
    print("✓ 청크 임베딩 및 저장 완료")
    
    # HTML 파일 처리
    print("\n[4/5] HTML 파일 처리 중...")
    
    # 1. URL에서 HTML 로드
    url = "https://react.dev"
    print(f"URL에서 HTML 로드 중: {url}")
    test_files = []

    try:
        response = requests.get(url)
        response.raise_for_status()
        html_content = response.text
        print(f"✓ HTML 파일 읽기 완료 (크기: {len(html_content)} bytes)")
        
        # 2. DOM 트리 파싱 및 주요 섹션 추출
        soup = BeautifulSoup(html_content, 'lxml')
        main_sections = []
        
        # 주요 섹션 태그들을 찾아서 추가
        for tag in ['main', 'header', 'section', 'article', 'nav', 'footer']:
            sections = soup.find_all(tag)
            for section in sections:
                if section.text.strip():  # 비어있지 않은 섹션만 추가
                    main_sections.append({
                        'tag': tag,
                        'content': section.text.strip()
                    })
        
        print(f"✓ 파싱된 주요 섹션 수: {len(main_sections)}")
        
        # 3. 각 섹션별로 가이드라인과 유사도 측정
        for section in main_sections:
            print(f"\n섹션 분석 중 ({section['tag']})...")
            
            # HTML 섹션 임베딩하여 유사한 가이드라인 찾기
            print("가이드라인 유사도 검색 중...")
            similar_guidelines = unified_db.search_similar(section['content'], k=1)
            
            if similar_guidelines and len(similar_guidelines) > 0:  # 결과가 있는지 확인
                guideline = similar_guidelines[0]
                print(f"✓ 매칭된 가이드라인:")
                print(f"  - 제목: {guideline['title']}")
                print(f"  - 카테고리: {guideline['category_name']}")
                print(f"  - 유사도: {guideline['score']:.4f}")
                
                # 테스트 결과 저장
                print("\n데이터베이스에 저장 중...")
                cursor.execute("""
                    INSERT INTO case_1_test_results (test_file, html_content, created_at)
                    VALUES (?, ?, ?)
                """, (url, section['content'], datetime.now()))
                test_result_id = cursor.lastrowid
                
                # 가이드라인 정보 저장
                cursor.execute("""
                    INSERT INTO unified_guidelines 
                    (case_1_test_results_id, guideline_id, title, category_name, content)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    test_result_id,
                    guideline['guideline_id'],
                    guideline['title'],
                    guideline['category_name'],
                    guideline['content']
                ))
                
                test_files.append({
                    'id': test_result_id,
                    'file': f"{url}#{section['tag']}",
                    'html_content': section['content'],
                    'guideline_content': guideline['content']
                })
                
                conn.commit()
                print("✓ 데이터베이스 저장 완료")
            else:
                print("⚠ 매칭되는 가이드라인을 찾지 못했습니다")

    except Exception as e:
        print(f"❌ URL 처리 중 오류 발생: {str(e)}")
        return
    
    # LLM 평가 수행
    print("\n[5/5] LLM 평가 시작...")
    total_files = len(test_files)
    print(f"평가할 파일 수: {total_files}")
    
    for i, test_file in enumerate(test_files, 1):
        print(f"\n[{i}/{total_files}] 파일: {test_file['file']}")
        print("-" * 30)
        
        try:
            print("LLM에 전달하는 데이터:")
            print(f"- HTML 크기: {len(test_file['html_content'])} bytes")
            print(f"- 가이드라인 크기: {len(test_file['guideline_content'])} bytes")
            
            success = evaluate_with_llm(
                conn,
                test_file['id'],
                test_file['html_content'],
                test_file['guideline_content'],
                test_file['file'],  # 파일명 전달
                'gemini-1.5-flash',
            )
            print(f"test_file name: {test_file['file']}")
            
            if success:
                print("✓ LLM 평가 완료")
            else:
                print("⚠ LLM 평가 실패")
            
        except Exception as e:
            print(f"❌ 오류 발생: {str(e)}")
            print(f"상세 정보: {e.args}")
    
    print("\n" + "="*50)
    print("테스트 스위트 평가 완료")
    print(f"총 처리 파일: {total_files}")
    print("="*50)
    
    conn.close()

if __name__ == "__main__":
    init_database()
    evaluate_url()