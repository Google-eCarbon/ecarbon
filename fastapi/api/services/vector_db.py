from typing import Dict, List, Any, Optional
import chromadb
from chromadb.config import Settings
from api.core.config import settings
from api.utils.json_parser import load_wsg_guidelines, extract_guidelines_for_embedding

class VectorDBService:
    def __init__(self):
        """ChromaDB 클라이언트와 컬렉션을 초기화합니다."""
        self.client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=settings.VECTOR_DB_PATH
        ))
        
        # WSG 가이드라인 컬렉션
        self.guidelines_collection = self.client.get_or_create_collection(
            name="wsg_guidelines",
            metadata={"description": "WSG 가이드라인 및 평가 기준"}
        )
        
        # 웹사이트 컨텐츠 컬렉션
        self.website_collection = self.client.get_or_create_collection(
            name="website_content",
            metadata={"description": "분석된 웹사이트 컨텐츠"}
        )
    
    def load_guidelines(self) -> None:
        """WSG 가이드라인을 로드하고 Vector DB에 저장합니다."""
        try:
            # 기존 데이터 삭제
            self.guidelines_collection.delete(where={"source": "wsg"})
            
            # 가이드라인 로드
            wsg_doc = load_wsg_guidelines()
            guidelines_map = extract_guidelines_for_embedding(wsg_doc)
            
            # Vector DB에 저장
            self.guidelines_collection.add(
                ids=list(guidelines_map.keys()),
                documents=list(guidelines_map.values()),
                metadatas=[{"source": "wsg"} for _ in guidelines_map]
            )
        except Exception as e:
            raise Exception(f"가이드라인 로드 중 오류 발생: {str(e)}")
    
    def add_website_content(self, url: str, content_chunks: List[str]) -> None:
        """웹사이트 컨텐츠를 Vector DB에 저장합니다."""
        try:
            # URL에 해당하는 기존 데이터 삭제
            self.website_collection.delete(where={"url": url})
            
            # 각 청크에 대한 고유 ID 생성
            chunk_ids = [f"{url}_{i}" for i in range(len(content_chunks))]
            
            # Vector DB에 저장
            self.website_collection.add(
                ids=chunk_ids,
                documents=content_chunks,
                metadatas=[{"url": url, "chunk_index": i} for i in range(len(content_chunks))]
            )
        except Exception as e:
            raise Exception(f"웹사이트 컨텐츠 저장 중 오류 발생: {str(e)}")
    
    def find_similar_guidelines(
        self, 
        content: str, 
        n_results: int = 5,
        threshold: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        주어진 컨텐츠와 가장 유사한 가이드라인을 찾습니다.
        
        Args:
            content: 유사도를 검색할 텍스트
            n_results: 반환할 최대 결과 수
            threshold: 최소 유사도 임계값 (0-1)
            
        Returns:
            유사한 가이드라인 목록 (ID, 거리, 메타데이터 포함)
        """
        try:
            results = self.guidelines_collection.query(
                query_texts=[content],
                n_results=n_results,
                where={"source": "wsg"}
            )
            
            # 결과 포맷팅
            similar_guidelines = []
            for i in range(len(results['ids'][0])):
                # 거리를 유사도 점수로 변환 (1 - 거리)
                similarity = 1 - results['distances'][0][i]
                if similarity >= threshold:
                    similar_guidelines.append({
                        'id': results['ids'][0][i],
                        'similarity': similarity,
                        'metadata': results['metadatas'][0][i]
                    })
            
            return similar_guidelines
            
        except Exception as e:
            raise Exception(f"가이드라인 검색 중 오류 발생: {str(e)}")
    
    def get_website_content(self, url: str) -> List[str]:
        """특정 URL의 저장된 컨텐츠를 조회합니다."""
        try:
            results = self.website_collection.get(
                where={"url": url}
            )
            return results['documents']
        except Exception as e:
            raise Exception(f"웹사이트 컨텐츠 조회 중 오류 발생: {str(e)}")