import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
from pathlib import Path
import shutil
import time
from typing import Dict, Any, List
from json_parser import load_wsg_guidelines, extract_guidelines_for_embedding

class VectorDBService:
    def __init__(self):
        """Vector DB 서비스를 초기화합니다."""
        self.persist_dir = Path(__file__).parent.parent.parent / "data" / "vector_db"
        
        # DB 디렉토리 초기화 (최대 3번 시도)
        for _ in range(3):
            try:
                if self.persist_dir.exists():
                    shutil.rmtree(str(self.persist_dir))
                break
            except PermissionError:
                time.sleep(1)  # 1초 대기
        
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        
        # 클라이언트 초기화 (allow_reset=True로 설정)
        settings = Settings(
            allow_reset=True,
            anonymized_telemetry=False
        )
        
        self.client = chromadb.PersistentClient(
            path=str(self.persist_dir),
            settings=settings
        )
        
        # 임베딩 함수 초기화
        self.collection = None
        self.embedding_function = embedding_functions.DefaultEmbeddingFunction()
        
        # DB 초기화
        self.client.reset()

    def load_guidelines(self):
        """가이드라인을 로드하고 Vector DB에 저장합니다."""
        try:
            # 새 컬렉션 생성
            self.collection = self.client.create_collection(
                name="wsg_guidelines",
                metadata={"description": "Web Sustainability Guidelines"},
                embedding_function=self.embedding_function
            )
            
            # 가이드라인 로드
            wsg_doc = load_wsg_guidelines()
            guidelines = extract_guidelines_for_embedding(wsg_doc)
            
            # 데이터 추가
            documents = []
            metadatas = []
            ids = []
            
            # 가이드라인이 리스트인지 딕셔너리인지 확인
            if isinstance(guidelines, dict):
                # 딕셔너리인 경우 items() 메서드 사용
                guideline_items = guidelines.items()
            elif isinstance(guidelines, list):
                # 리스트인 경우 각 항목에 인덱스를 ID로 사용
                guideline_items = [(str(i), item) for i, item in enumerate(guidelines)]
            else:
                raise Exception(f"Unexpected guidelines type: {type(guidelines)}")
                
            for guideline_id, guideline in guideline_items:
                documents.append(guideline['text'])
                
                # 가이드라인 메타데이터 구성 - 실제 데이터 구조에 맞게 수정
                metadata = {
                    'full_id': guideline.get('full_id', ''),
                    'category_id': guideline.get('category_id', ''),
                    'category_name': guideline.get('category_name', ''),
                    'guideline_id': guideline.get('guideline_id', ''),
                    'title': guideline.get('title', '')
                }
                
                # 옵션널 필드 추가
                if 'url' in guideline:
                    metadata['url'] = guideline['url']
                if 'criteria' in guideline:
                    metadata['criteria'] = guideline['criteria']
                
                metadatas.append(metadata)
                ids.append(guideline_id)
            
            if documents:  # 데이터가 있는 경우에만 추가
                self.collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
        
        except Exception as e:
            raise Exception(f"가이드라인 로드 중 오류 발생: {str(e)}")
    
    def find_relevant_guidelines(self, url: str, tag_map: Dict[str, int], top_k: int = 5) -> List[Dict[str, Any]]:
        """태그맵을 기반으로 관련 가이드라인을 검색합니다."""
        try:
            # 태그맵을 문자열로 변환
            tag_query = " ".join([f"{tag} ({count})" for tag, count in tag_map.items()])
            
            # 검색 실행
            results = self.collection.query(
                query_texts=[tag_query],
                n_results=top_k,
                include=['metadatas', 'distances']
            )
            
            # 결과 변환
            guidelines = []
            for i in range(len(results['ids'][0])):
                guideline_id = results['ids'][0][i]
                metadata = results['metadatas'][0][i]
                distance = results['distances'][0][i]
                
                # 가중치 계산 (거리가 작을수록 유사도가 높음)
                weight = 1.0 / (1.0 + distance)
                
                guidelines.append({
                    'guideline_id': guideline_id,
                    'impact': metadata['impact'],
                    'effort': metadata['effort'],
                    'tags': metadata['tags'].split(','),  # 문자열을 리스트로 변환
                    'weight': weight
                })
            
            return guidelines
            
        except Exception as e:
            raise Exception(f"가이드라인 검색 중 오류 발생: {str(e)}")

    def add_website_content(self, url: str, content: str, chunks: List[Dict[str, Any]]):
        """웹사이트 콘텐츠를 Vector DB에 추가합니다."""
        try:
            collection_name = f"website_{url.replace('/', '_').replace(':', '_')}"
            
            # 새 컬렉션 생성
            collection = self.client.create_collection(
                name=collection_name,
                metadata={"url": url},
                embedding_function=self.embedding_function
            )
            
            # 청크 데이터 추가
            documents = []
            metadatas = []
            ids = []
            
            for i, chunk in enumerate(chunks):
                documents.append(chunk['text'])
                metadatas.append({
                    'tag': chunk['tag'],
                    'tokens': chunk['tokens'],
                    'attributes': str(chunk['attributes'])  # 딕셔너리를 문자열로 변환
                })
                ids.append(f"chunk_{i}")
            
            if documents:  # 데이터가 있는 경우에만 추가
                collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
            
        except Exception as e:
            raise Exception(f"웹사이트 콘텐츠 추가 중 오류 발생: {str(e)}")