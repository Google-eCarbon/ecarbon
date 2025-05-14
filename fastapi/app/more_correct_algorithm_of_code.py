from pydantic import BaseModel, Field
from langchain.output_parsers import StructuredOutputParser
from langchain.prompts import ChatPromptTemplate
import sqlite3
import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from bs4 import BeautifulSoup
import requests
from langchain_openai import OpenAIEmbeddings
from typing import List
from langchain_community.vectorstores import Chroma
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

# def init_database():
#     """SQLite 데이터베이스 초기화"""
#     conn = sqlite3.connect('evaluation_wsg.db')
#     c = conn.cursor()
    
#     # Drop existing tables if they exist
#     c.execute('DROP TABLE IF EXISTS case_1_llm_evaluation')
#     c.execute('DROP TABLE IF EXISTS guideline_chunks')
#     c.execute('DROP TABLE IF EXISTS similar_guidelines')
#     c.execute('DROP TABLE IF EXISTS unified_guidelines')
#     c.execute('DROP TABLE IF EXISTS case_1_test_results')
    
#     # 테스트 결과 테이블
#     c.execute('''CREATE TABLE IF NOT EXISTS case_1_test_results (
#         id INTEGER PRIMARY KEY AUTOINCREMENT,
#         test_file TEXT,
#         html_content TEXT,
#         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
#     )''')
    
#     # 유사 가이드라인 테이블 (통합 버전)
#     c.execute('''CREATE TABLE IF NOT EXISTS unified_guidelines (
#         id INTEGER PRIMARY KEY AUTOINCREMENT,
#         case_1_test_results_id INTEGER,
#         guideline_id TEXT,
#         title TEXT,
#         category_name TEXT,
#         url TEXT,
#         similarity_score REAL,
#         content TEXT,
#         FOREIGN KEY (case_1_test_results_id) REFERENCES case_1_test_results (id)
#     )''')

#     # LLM 평가 결과 테이블
#     c.execute('''CREATE TABLE IF NOT EXISTS case_1_llm_evaluation (
#         id INTEGER PRIMARY KEY AUTOINCREMENT,
#         case_1_test_results_id INTEGER,
#         model TEXT,
#         test_file_title TEXT,
#         guideline_id TEXT,
#         relevant_code TEXT,
#         violation TEXT,
#         explanation TEXT,
#         corrected_code TEXT,
#         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#         FOREIGN KEY (case_1_test_results_id) REFERENCES case_1_test_results (id)
#     )''')
    
#     conn.commit()
#     return conn


# class Embedder:
#     def __init__(self, **kwargs):
#         self.model = OpenAIEmbeddings(
#             model="text-embedding-ada-002",
#             openai_api_key="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"  # 실제 API 키로 교체 필요
#         )

#     def embed_documents(self, texts: List[str]) -> List[List[float]]:
#         return self.model.embed_documents(texts)

#     def embed_query(self, text: str) -> List[float]:
#         return self.model.embed_query(text)

# class VectorDBManager:
#     def __init__(self, persist_dir: str = "db", embedding_fn = None, force_new: bool = False, collection_name: str = "guidelines"):
#         """
#         벡터 DB 매니저 초기화
        
#         Args:
#             persist_dir (str): 벡터 DB 저장 경로
#             embedding_fn: 임베딩 함수 (기본값: None)
#             force_new (bool): True일 경우 기존 DB를 삭제하고 새로 생성 (X)
#             collection_name (str): 컬렉션 이름 (기본값: "guidelines")
#         """
#         if embedding_fn is None:
#             embedding_fn = Embedder()
            
#         self.db = Chroma(
#             persist_directory=persist_dir,
#             embedding_function=embedding_fn,
#             collection_name=collection_name
#         )
#         self._guideline_cache = {}  # 가이드라인 캐시
        
#     @classmethod
#     def create_unified_db(cls, persist_dir: str = "unified_db", **kwargs):
#         """통합된 가이드라인을 저장하는 벡터 DB 생성"""
#         return cls(persist_dir=persist_dir, collection_name="unified_guidelines", **kwargs)
    
#     @classmethod
#     def create_parts_db(cls, persist_dir: str = "parts_db", **kwargs):
#         """가이드라인 부분들을 저장하는 벡터 DB 생성"""
#         return cls(persist_dir=persist_dir, collection_name="guideline_parts", **kwargs)

#     def add_unified_chunks(self, chunks: List[Dict[str, Any]]):
#         """통합된 가이드라인 청크 추가"""
#         texts = []
#         metadatas = []
#         for chunk in chunks:
#             texts.append(chunk["text"])
#             metadatas.append(chunk["metadata"])
#             # 캐시 업데이트
#             self._guideline_cache[chunk["metadata"]["full_id"]] = {
#                 "title": chunk["metadata"]["title"],
#                 "category_name": chunk["metadata"]["category_name"],
#                 "url": chunk["metadata"]["url"]
#             }
#         self.add(texts, metadatas)

#     def add_part_chunks(self, chunks: List[Dict[str, Any]]):
#         """가이드라인 부분 청크 추가"""
#         texts = []
#         metadatas = []
#         for chunk in chunks:
#             texts.append(chunk["text"])
#             metadatas.append(chunk["metadata"] | {"chunk_type": chunk["type"]})
#             # 캐시 업데이트
#             self._guideline_cache[chunk["metadata"]["full_id"]] = {
#                 "title": chunk["metadata"].get("title", ""),
#                 "category_name": chunk["metadata"]["category_name"],
#                 "url": chunk["metadata"]["url"]
#             }
#         self.add(texts, metadatas)

#     def add(self, texts: List[str], metas: List[Dict[str, Any]] = None):
#         """
#         텍스트와 메타데이터를 벡터 DB에 추가
        
#         Args:
#             texts (List[str]): 임베딩할 텍스트 리스트
#             metas (List[Dict]): 메타데이터 리스트
#         """
#         if metas is None:
#             metas = [{}] * len(texts)
#         self.db.add_texts(texts, metadatas=metas)

#     def as_retriever(self, k: int = 1): # TOP-K
#         """벡터 DB를 retriever로 변환"""
#         return self.db.as_retriever(search_kwargs={"k": k})

#     def delete(self, ids: List[str]):
#         """지정된 ID의 문서들을 삭제"""
#         self.db.delete(ids)

#     def add_chunks(self, chunks: List[Dict[str, Any]]):
#         """
#         청크 리스트를 벡터 DB에 추가
        
#         Args:
#             chunks (List[Dict]): GuidelineChunker에서 생성된 청크 리스트
#         """
#         texts = []
#         metadatas = []
        
#         for chunk in chunks:
#             # 메인 가이드라인 정보 캐시
#             if chunk["type"] == "main":
#                 self._guideline_cache[chunk["metadata"]["full_id"]] = {
#                     "title": chunk["text"].split("\n")[0].replace("Guideline: ", ""),
#                     "category_name": chunk["metadata"]["category_name"],
#                     "url": chunk["metadata"]["url"]
#                 }
            
#             texts.append(chunk["text"])
#             metadatas.append(chunk["metadata"] | {"chunk_type": chunk["type"]})
        
#         self.add(texts, metadatas)

#     def search_similar(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
#         """
#         쿼리와 가장 유사한 가이드라인을 검색
        
#         Args:
#             query (str): 검색 쿼리
#             k (int): 반환할 결과 수
            
#         Returns:
#             List[Dict]: 검색 결과 리스트. 각 결과는 가이드라인 정보와 관련 청크를 포함
#         """
#         print("유사도검색 시작합니다.")
#         results = self.db.similarity_search_with_score(query, k=k*2)  # 더 많은 결과를 가져와서 필터링
        
#         # 결과를 가이드라인별로 그룹화
#         guideline_groups = {}
#         for doc, score in results:
#             metadata = doc.metadata
#             full_id = metadata.get("full_id", "unknown")
            
#             if full_id not in guideline_groups:
#                 # 캐시된 가이드라인 정보 사용
#                 cache_info = self._guideline_cache.get(full_id, {})
                
#                 guideline_groups[full_id] = {
#                     "guideline_id": full_id,
#                     "title": metadata.get("title", cache_info.get("title", "")),
#                     "category_name": metadata.get("category_name", cache_info.get("category_name", "")),
#                     "url": metadata.get("url", cache_info.get("url", "")),
#                     "score": score,
#                     "content": doc.page_content,  # 통합 버전에서 사용
#                     "related_chunks": []  # 부분 버전에서 사용
#                 }
            
#             # 부분 버전인 경우에만 청크 정보 추가
#             if "chunk_type" in metadata:
#                 guideline_groups[full_id]["related_chunks"].append({
#                     "type": metadata["chunk_type"],
#                     "content": doc.page_content,
#                     "score": score
#                 })
            
#             # 통합 버전인 경우 점수 업데이트 (더 좋은 점수로)
#             elif score < guideline_groups[full_id]["score"]:
#                 guideline_groups[full_id]["score"] = score
#                 guideline_groups[full_id]["content"] = doc.page_content
        
#         # 점수로 정렬하여 상위 k개 반환
#         sorted_results = sorted(guideline_groups.values(), key=lambda x: x["score"])
#         return sorted_results[:k]

#     def clear(self):
#         """벡터 DB의 모든 데이터를 삭제"""
#         self.db._collection.delete(where={})
#         self._guideline_cache.clear()

#     def get_collection_stats(self) -> Dict[str, int]:
#         """벡터 DB 컬렉션 통계 반환"""
#         count = self.db._collection.count()
#         return {
#             "total_documents": count
#         }

# class InputGuidelineLoader:
#     """data/guidelines.json 파일을 읽어서 JSON 객체로 반환"""

#     def __init__(self, file_path: str):
#         print(f"\n=== Guideline Loader Initialization ===")
#         print(f"File path: {file_path}")
#         self.file_path = Path(file_path)
#         self._data = None

#     def load_all(self) -> Dict[str, Any]:
#         print("\n=== Loading Guideline Data ===")
#         if not self.file_path.exists():
#             print(f"Error: File not found - {self.file_path}")
#             raise FileNotFoundError(self.file_path)
#         if self._data is None:
#             with open(self.file_path, 'r', encoding='utf-8') as f:
#                 self._data = json.load(f)
#                 print("Guideline data loaded successfully")
#                 print(f"Number of categories: {len(self._data.get('category', []))}")
#         return self._data

#     def _get_category_id_from_prefix(self, file_prefix: str) -> Optional[str]:
#         """파일 prefix로부터 카테고리 ID 결정"""
#         # 카테고리 ID 매핑
#         prefix_map = {
#             'BSPM': '5',  # Business Strategy And Product Management
#             'UX': '2',    # User Experience
#             'WD': '3',    # Web Design
#             'HIS': '4'    # Hosting Infrastructure Services
#         }
        
#         # 파일 prefix 추출 (예: BSPM01-1 -> BSPM)
#         main_prefix = ''.join(c for c in file_prefix if c.isalpha())
#         print(f"Extracted main prefix: {main_prefix}")
        
#         category_id = prefix_map.get(main_prefix)
#         if category_id:
#             print(f"Mapped to category ID: {category_id}")
#         else:
#             print(f"Warning: No category mapping for {main_prefix}")
        
#         return category_id

#     def get_guideline_for_test_file(self, test_file: str) -> Tuple[Optional[str], Optional[Dict]]:
#         """테스트 파일명으로부터 해당하는 가이드라인과 criteria, intent, benefits, example, tags 반환"""
#         print(f"\n=== Finding guideline for test file: {test_file} ===")
        
#         # 파일 prefix 추출 (예: BSPM01-1.html -> BSPM01-1)
#         file_prefix = test_file.split('.')[0]
#         print(f"File prefix: {file_prefix}")
        
#         try:
#             # 파일명을 '-'로 분리 (예: 'BSPM01-1' -> ['BSPM01', '1'])
#             base_prefix, criteria_num = file_prefix.split('-')
            
#             # 카테고리 prefix와 section 번호 분리
#             # (예: 'BSPM01' -> 카테고리:'BSPM', section:'01')
#             category_prefix = ''.join(c for c in base_prefix if c.isalpha())
#             section_num_raw = base_prefix[len(category_prefix):]
            
#             # section 번호가 한 자리수인 경우 앞에 0 붙이기
#             section_num = str(int(section_num_raw))  # 숫자로 변환했다가 다시 문자열로
            
#             print(f"Extracted main prefix: {category_prefix}")
#             print(f"Section number: {section_num}")
            
#             # 카테고리 ID 찾기
#             category_id = self._get_category_id_from_prefix(category_prefix)
#             if not category_id:
#                 print("Category not found")
#                 return None, None
            
#             # 카테고리 찾기
#             category = next((cat for cat in self._data['category'] if cat['id'] == category_id), None)
#             if not category:
#                 print(f"Category with ID {category_id} not found")
#                 return None, None
            
#             # 가이드라인 찾기
#             guideline = next((g for g in category['guidelines'] if g['id'] == section_num), None)
#             if not guideline:
#                 print(f"Guideline {section_num} not found in category {category_id}")
#                 return None, None
            
#             # criteria 찾기
#             original_prefix = file_prefix  # 원래 파일명 저장 (예: BSPM01-1)
#             matching_criteria = None
#             for criterion in guideline['criteria']:
#                 testable = criterion['testable']
#                 if isinstance(testable, str) and 'Machine-testable' in testable:
#                     test_id = testable.split('#')[-1].rstrip(')')  # URL에서 테스트 ID 추출하고 끝의 ) 제거
                    
#                     if test_id == original_prefix:
#                         print(f"Test ID: {test_id}")
#                         matching_criteria = criterion
#                         break
            
#             if not matching_criteria:
#                 print(f"No matching criteria found for test ID {file_prefix}")
#                 return None, None
            
#             # 가이드라인의 모든 정보를 포함하는 결과 딕셔너리 생성
#             result = {
#                 'guideline_id': section_num,
#                 'guideline_title': guideline['guideline'],
#                 'criteria': matching_criteria['description'],
#                 'intent': guideline.get('intent', ''),
#                 'benefits': ', '.join(benefit.get('benefit', '') for benefit in guideline.get('benefits', [])),
#                 'example': guideline.get('example', ''),
#                 'tags': ', '.join(str(tag) for tag in guideline.get('tags', []))
#             }
            
#             print("Found matching guideline and details:")
#             print(f"Guideline: {result['guideline_title']}")
#             print(f"Criteria: {result['criteria'][:100]}...")
#             print(f"Intent: {result['intent'][:100]}..." if result['intent'] else " ")
#             print(f"Benefits: {result['benefits'][:100]}..." if result['benefits'] else " ")
#             print(f"Tags: {result['tags'][:100]}..." if result['tags'] else " ")
            
#             return file_prefix, result
            
#         except (IndexError, ValueError) as e:
#             print(f"Error parsing file name: {str(e)}")
#             return None, None

#     def load_all_test_files(self) -> List[str]:
#         """test_suite 디렉토리의 모든 HTML 파일명을 원래 순서대로 반환"""
#         test_suite_dir = Path("data/test_suite")
#         if not test_suite_dir.exists():
#             raise FileNotFoundError(test_suite_dir)
#         return [f.name for f in test_suite_dir.glob("*.html")]  


# class GuidelineChunker:
#     def __init__(self, guideline_json: Dict[str, Any]):
#         self.data = guideline_json

#     def _create_chunk(self, text: str, chunk_type: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
#         """
#         청크 객체를 생성합니다.
        
#         Args:
#             text (str): 청크의 텍스트 내용
#             chunk_type (str): 청크의 유형 (예: guideline, criterion, benefit 등)
#             metadata (Dict): 청크의 메타데이터
            
#         Returns:
#             Dict[str, Any]: 청크 객체
#         """
#         return {
#             "text": text,
#             "type": chunk_type,
#             "metadata": metadata
#         }

#     def chunk_by_parts(self) -> List[Dict[str, Any]]:
#         """
#         가이드라인을 세부 부분(main, criterion, benefit 등)으로 분리하여 청크로 만듭니다.
        
#         Returns:
#             List[Dict[str, Any]]: 청크 리스트. 각 청크는 텍스트, 유형, 메타데이터를 포함
#         """
#         chunks = []
        
#         for category in self.data.get("category", []):
#             category_id = category["id"]
#             category_name = category["name"]
            
#             if "guidelines" not in category:
#                 continue
                
#             for guideline in category["guidelines"]:
#                 guideline_id = guideline["id"]
#                 base_metadata = {
#                     "category_id": category_id,
#                     "category_name": category_name,
#                     "guideline_id": guideline_id,
#                     "full_id": f"{category_id}-{guideline_id}",
#                     "url": guideline["url"]
#                 }
                
#                 # 1. 가이드라인 제목과 의도를 하나의 청크로
#                 main_text = f"Guideline: {guideline['guideline']}\nIntent: {guideline.get('intent', '')}"
#                 chunks.append(self._create_chunk(
#                     main_text,
#                     "main",
#                     {**base_metadata, "impact": guideline.get("impact", ""), "effort": guideline.get("effort", "")}
#                 ))
                
#                 # 2. 각 평가 기준을 개별 청크로
#                 for criterion in guideline.get("criteria", []):
#                     criterion_text = f"Criterion: {criterion.get('title', '')}\nDescription: {criterion.get('description', '')}"
#                     if 'testable' in criterion:
#                         criterion_text += f"\nTestable: {criterion['testable']}"
                    
#                     chunks.append(self._create_chunk(
#                         criterion_text,
#                         "criterion",
#                         {**base_metadata, "criterion_title": criterion.get("title", "")}
#                     ))
                
#                 # 3. 각 혜택을 개별 청크로
#                 for benefit_dict in guideline.get("benefits", []):
#                     for category, description in benefit_dict.items():
#                         benefit_text = f"Benefit - {category}:\n{description}"
#                         chunks.append(self._create_chunk(
#                             benefit_text,
#                             "benefit",
#                             {**base_metadata, "benefit_category": category}
#                         ))
                
#                 # 4. GRI 메트릭스를 하나의 청크로
#                 if guideline.get("GRI"):
#                     gri_parts = []
#                     for gri_dict in guideline["GRI"]:
#                         for metric, impact in gri_dict.items():
#                             gri_parts.append(f"{metric}: {impact}")
#                     gri_text = "GRI Metrics:\n" + "\n".join(gri_parts)
#                     chunks.append(self._create_chunk(
#                         gri_text,
#                         "gri",
#                         base_metadata
#                     ))
                
#                 # 5. 예시들을 하나의 청크로
#                 if guideline.get("example"):
#                     examples_text = "Examples:\n" + "\n".join(
#                         example.get("content", "") for example in guideline["example"]
#                     )
#                     chunks.append(self._create_chunk(
#                         examples_text,
#                         "example",
#                         base_metadata
#                     ))
                
#                 # 6. 리소스들을 청크로
#                 if guideline.get("resources"):
#                     resources_text = "Resources:\n" + "\n".join(
#                         f"{title}: {url}" 
#                         for resource_dict in guideline["resources"]
#                         for title, url in resource_dict.items()
#                     )
#                     chunks.append(self._create_chunk(
#                         resources_text,
#                         "resource",
#                         base_metadata
#                     ))
        
#         return chunks

#     def _create_unified_guideline_text(self, guideline: Dict[str, Any]) -> str:
#         """가이드라인의 모든 내용을 하나의 텍스트로 통합"""
#         parts = []
        
#         # 제목과 의도
#         parts.append(f"Title: {guideline.get('guideline', '')}")
#         parts.append(f"Intent: {guideline.get('intent', '')}\n")
        
#         # 기준
#         if 'criteria' in guideline:
#             parts.append("Criteria:")
#             for criterion in guideline['criteria']:
#                 parts.append(f"- {criterion.get('description', '')}")
#             parts.append("")
            
#         # 이점
#         if 'benefits' in guideline:
#             parts.append("Benefits:")
#             for benefit_dict in guideline['benefits']:
#                 for category, description in benefit_dict.items():
#                     parts.append(f"{category}:")
#                     parts.append(f"- {description}")
#             parts.append("")
            
#         # GRI 메트릭스
#         if guideline.get("GRI"):
#             parts.append("GRI Metrics:")
#             for gri_dict in guideline["GRI"]:
#                 for metric, impact in gri_dict.items():
#                     parts.append(f"- {metric}: {impact}")
#             parts.append("")
            
#         # 예시
#         if guideline.get("example"):
#             parts.append("Examples:")
#             for example in guideline["example"]:
#                 parts.append(f"- {example.get('content', '')}")
#             parts.append("")
            
#         # 리소스
#         if guideline.get("resources"):
#             parts.append("Resources:")
#             for resource_dict in guideline["resources"]:
#                 for title, url in resource_dict.items():
#                     parts.append(f"- {title}: {url}")
        
#         return "\n".join(parts)

#     def chunk_unified(self) -> List[Dict[str, Any]]:
#         """
#         각 가이드라인의 모든 내용을 하나의 청크로 통합하여 반환합니다.
        
#         Returns:
#             List[Dict[str, Any]]: 청크 리스트. 각 청크는 하나의 완전한 가이드라인을 포함
#         """
#         chunks = []
        
#         for category in self.data.get("category", []):
#             category_id = category["id"]
#             category_name = category["name"]
            
#             if "guidelines" not in category:
#                 continue
                
#             for guideline in category["guidelines"]:
#                 guideline_id = guideline["id"]
                
#                 # 가이드라인의 모든 내용을 하나의 텍스트로 통합
#                 text = self._create_unified_guideline_text(guideline)
                
#                 # 메타데이터 설정
#                 metadata = {
#                     "category_id": category_id,
#                     "category_name": category_name,
#                     "guideline_id": guideline_id,
#                     "full_id": f"{category_id}-{guideline_id}",
#                     "title": guideline.get("guideline", ""),
#                     "url": guideline.get("url", "")
#                 }
                
#                 # 청크 생성
#                 chunks.append(self._create_chunk(
#                     text,
#                     "unified",
#                     metadata
#                 ))
        
#         return chunks

#     # 기존의 chunk() 메서드는 chunk_by_parts()의 별칭으로 유지
#     chunk = chunk_by_parts


# class EvaluationResult(BaseModel):
#     relevant_code: str = Field(description="The code snippet from the input that is relevant to the guideline")
#     violation: str = Field(description="'Yes' if the code violates the guideline, 'No' if it doesn't")
#     explanation: str = Field(description="Detailed explanation of why the code violates or complies with the guideline")
#     corrected_code: str = Field(description="If there's a violation, provide the corrected code. If no violation, write 'Not applicable'")

# def create_chain(model_name, use_google=False):
#     """LLM 체인 생성"""
#     # 파서 구성
#     parser = StructuredOutputParser.from_response_schemas([
#         {
#             "name": "relevant_code",
#             "description": "The code snippet from the input that is relevant to the guideline",
#             "type": "string"
#         },
#         {
#             "name": "violation",
#             "description": "'Yes' if the code violates the guideline, 'No' if it doesn't",
#             "type": "string"
#         },
#         {
#             "name": "explanation",
#             "description": "Detailed explanation of why the code violates or complies with the guideline",
#             "type": "string"
#         },
#         {
#             "name": "corrected_code",
#             "description": "If there's a violation, provide the corrected code. If no violation, write 'Not applicable'",
#             "type": "string"
#         }
#     ])
    
#     # 프롬프트 템플릿 생성
#     template = """You are an expert in web sustainability guidelines. Analyze the following code snippet against the provided guideline.

# Code:
# {code}

# Guideline:
# {guideline}

# Provide your analysis in a strict JSON format with the following fields:
# 1. "relevant_code": Extract and quote the relevant code snippet from the input
# 2. "violation": Must be exactly "Yes" or "No"
# 3. "explanation": Your detailed explanation
# 4. "corrected_code": If violation is "Yes", provide corrected code. If "No", write "Not applicable"

# IMPORTANT:
# - Use proper JSON formatting with quotes around string values
# - Include ALL four fields in your response
# - Make sure there are no trailing commas
# - Each field should be on a new line
# - Do not include any text outside the JSON object

# Example of correct format:
# {{
#     "relevant_code": "example code here",
#     "violation": "No",
#     "explanation": "This code complies because...",
#     "corrected_code": "Not applicable"
# }}

# Your response (in strict JSON format):"""

#     prompt = ChatPromptTemplate.from_template(template)

#     if use_google:
#         llm = ChatGoogleGenerativeAI(
#             model=model_name,
#             temperature=0,
#             google_api_key="AIzaSyDBfptxKS2F2IuCZ2C8htra-c0bw1R5vog"
#         )
    
#     # 체인 생성
#     chain = prompt | llm
    
#     return chain, parser

# def evaluate_code(code: str, guideline: str, model_name, use_groq=False, use_claude=False, use_openai=False, use_google=False) -> EvaluationResult:
#     """코드와 가이드라인을 평가"""
#     chain, parser = create_chain(model_name, use_google)
#     response = chain.invoke({
#         "code": code,
#         "guideline": guideline
#     })
    
#     # AIMessage 객체에서 content 추출
#     content = response.content if hasattr(response, 'content') else str(response)
    
#     # 응답 정리 및 파싱
#     try:
#         # 응답에서 JSON 부분만 추출
#         content = content.strip()
#         if content.startswith('```json'):
#             content = content[7:]
#         if content.endswith('```'):
#             content = content[:-3]
#         content = content.strip()
        
#         print("\n=== LLM 응답 디버깅 ===")
#         print("정제된 응답:")
#         print(content)
#         print("\n응답 문자 분석:")
#         for i, char in enumerate(content):
#             if char in ['"', "'", "}", "{", ","]:
#                 print(f"위치 {i}: '{char}'")
#         print("=" * 30)
        
#         # JSON 파싱 시도
#         try:
#             parsed_dict = json.loads(content)
#         except json.JSONDecodeError as e:
#             print(f"\nJSON 파싱 오류 상세:")
#             print(f"오류 메시지: {str(e)}")
#             print(f"오류 위치: line {e.lineno}, column {e.colno}")
#             print(f"오류 문자: '{content[e.pos]}'")
#             print(f"문맥:")
#             start = max(0, e.pos - 20)
#             end = min(len(content), e.pos + 20)
#             print(content[start:end])
#             print(" " * (e.pos - start) + "^")
#             raise
        
#         # 필수 필드 확인
#         required_fields = ["relevant_code", "violation", "explanation", "corrected_code"]
#         missing_fields = [field for field in required_fields if field not in parsed_dict]
#         if missing_fields:
#             raise ValueError(f"다음 필드가 누락됨: {', '.join(missing_fields)}")
        
#         return EvaluationResult(
#             relevant_code=parsed_dict["relevant_code"],
#             violation=parsed_dict["violation"],
#             explanation=parsed_dict["explanation"],
#             corrected_code=parsed_dict["corrected_code"]
#         )
        
#     except Exception as e:
#         print(f"파싱 오류: {str(e)}")
#         print(f"LLM 응답: {content}")
#         raise

# def evaluate_with_llm(conn, test_result_id: int, html_content: str, guideline_content: str, test_file_title: str, guideline_id: str, model_name='gemini-1.5-flash'):
#     """LLM을 사용하여 HTML 코드와 가이드라인을 평가"""
#     try:
#         result = evaluate_code(html_content, guideline_content, model_name, use_google=True)
        
#         # 평가 결과 저장
#         cursor = conn.cursor()
#         cursor.execute("""
#         INSERT INTO case_1_llm_evaluation 
#         (case_1_test_results_id, model, test_file_title, guideline_id, relevant_code, violation, explanation, corrected_code)
#         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
#         """, (
#             test_result_id,
#             model_name,
#             test_file_title,
#             guideline_id,
#             result.relevant_code,
#             result.violation,
#             result.explanation,
#             result.corrected_code
#         ))
#         conn.commit()
#         return True
#     except Exception as e:
#         print(f"LLM 평가 중 오류 발생: {str(e)}")
#         return False

# def get_html_file(url) -> str:
#     """URL에서 HTML 내용을 가져옵니다."""
#     try:
#         response = requests.get(url)
#         response.raise_for_status()
#         return response.text
#     except Exception as e:
#         print(f"HTML 가져오기 실패: {str(e)}")
#         return ""

# def initialize_vector_db():
#     """벡터 DB를 초기화하고 가이드라인을 로드합니다."""
#     print("\n[1/3] 가이드라인 데이터 로드 중...")
#     loader = InputGuidelineLoader("data/wsg_guidelines.json")
#     guideline_json = loader.load_all()
    
#     print("\n[2/3] 가이드라인 청킹 중...")
#     chunker = GuidelineChunker(guideline_json)
#     unified_chunks = chunker.chunk_unified()
    
#     print(f'unified_chunks: {unified_chunks}')

#     print("\n[3/3] 벡터 DB 초기화 중...")
#     unified_db = VectorDBManager.create_unified_db(persist_dir="unified_db")
#     unified_db.add_unified_chunks(unified_chunks)
    
#     return unified_db

# def find_similar_guidelines(html_content: str, vector_db: VectorDBManager, similarity_threshold: float = 0.7) -> List[Dict[str, Any]]:
#     """HTML 컨텐츠와 유사한 가이드라인을 찾습니다."""
#     # BeautifulSoup으로 HTML 파싱
#     soup = BeautifulSoup(html_content, 'html.parser')
    
#     # 전체 HTML 텍스트 추출
#     full_text = soup.get_text(strip=True)
#     print(f"\n=== 추출된 전체 텍스트 (일부) ===\n{full_text[:500]}...\n")
    
#     # 전체 텍스트에 대해 유사한 가이드라인 찾기
#     results = vector_db.search_similar(full_text, k=1)  # 상위 5개 가이드라인
#     similar_guidelines = []
    
#     print("\n=== 발견된 유사 가이드라인 ===")
#     for result in results:
#         if result['score'] < similarity_threshold:
#             guideline = {
#                 'guideline_id': result['guideline_id'],
#                 'title': result['title'],
#                 'category_name': result['category_name'],
#                 'content': result['content'],
#                 'score': result['score']
#             }
#             similar_guidelines.append(guideline)
#             print(f"\nID: {guideline['guideline_id']}")
#             print(f"제목: {guideline['title']}")
#             print(f"카테고리: {guideline['category_name']}")
#             print(f"유사도 점수: {guideline['score']:.4f}")
    
#     return similar_guidelines

def evaluate_website(url: str, conn=None, test_result_id: int = None):
    """웹사이트를 평가하고 보고서를 생성합니다."""
    # 1. HTML 가져오기
    print(f"\n[1/4] {url} 에서 HTML 가져오는 중...")
    html_content = get_html_file(url)
    if not html_content:
        return
    
    # 2. 벡터 DB 초기화
    print("\n[2/4] 벡터 DB 초기화 중...")
    vector_db = initialize_vector_db()
    
    # 3. 유사한 가이드라인 찾기
    print("\n[3/4] 유사한 가이드라인 검색 중...")
    similar_guidelines = find_similar_guidelines(html_content, vector_db)
    print(f"발견된 관련 가이드라인: {len(similar_guidelines)}개")
    
    # 4. LLM으로 각 가이드라인 평가
    print("\n[4/4] LLM 평가 시작...")
    evaluation_results = []
    
    for guideline in similar_guidelines:
        print(f"\n가이드라인 평가 중: {guideline['guideline_id']}")
        try:
            if conn and test_result_id:
                # DB에 저장하는 경우
                success = evaluate_with_llm(
                    conn=conn,
                    test_result_id=test_result_id,
                    html_content=html_content,
                    guideline_content=guideline['content'],
                    test_file_title=url,
                    guideline_id=guideline['guideline_id'],
                    model_name='gemini-1.5-pro'
                )
                if success:
                    print(f"가이드라인 {guideline['guideline_id']} 평가 결과가 DB에 저장되었습니다.")
            else:
                # DB 저장 없이 결과만 반환
                result = evaluate_code(
                    html_content,
                    guideline['content'],
                    'gemini-1.5-pro',
                    use_google=True
                )
                evaluation_results.append({
                    'guideline_id': guideline['guideline_id'],
                    'title': guideline['title'],
                    'category': guideline['category_name'],
                    'similarity_score': guideline['score'],
                    'evaluation': result
                })
        except Exception as e:
            print(f"평가 실패: {str(e)}")
    
    return evaluation_results

if __name__ == "__main__":
    # 데이터베이스 초기화
    # init_database()
    conn = sqlite3.connect('evaluation_wsg.db')
    cursor = conn.cursor()
    
    # 테스트 결과 생성
    url = "https://react.dev"
    cursor.execute("""
        INSERT INTO case_1_test_results (test_file, html_content)
        VALUES (?, ?)
    """, (url, get_html_file(url)))
    conn.commit()
    
    # 생성된 test_result_id 가져오기
    test_result_id = cursor.lastrowid
    
    # 평가 실행
    results = evaluate_website(url=url, conn=conn, test_result_id=test_result_id)
    
    if results:
        print("\n=== 평가 결과 ===")
        for result in results:
            print(f"\n[가이드라인 {result['guideline_id']}] {result['title']}")
            print(f"카테고리: {result['category']}")
            print(f"유사도 점수: {result['similarity_score']:.4f}")
            print(f"위반 여부: {result['evaluation'].violation}")
            if result['evaluation'].violation == 'Yes':
                print(f"설명: {result['evaluation'].explanation}")
                print(f"수정 제안: {result['evaluation'].corrected_code}")
    
    conn.close()