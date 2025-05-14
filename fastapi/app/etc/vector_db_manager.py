from langchain_community.vectorstores import Chroma
from services.input_loader import InputGuidelineLoader
from utils.chunker import GuidelineChunker
from services.embedder import Embedder
from typing import Dict, Any, List, Tuple
import json
import os
import shutil

'''
가이드라인 JSON 구조 → 사람이 읽을 수 있는 자연어 묶음으로 통합 → 벡터 임베딩 → 유사도 기반 검색
'''
class VectorDBManager:
    def __init__(self, persist_dir: str = "db", embedding_fn = None, force_new: bool = False, collection_name: str = "guidelines"):
        """
        벡터 DB 매니저 초기화
        
        Args:
            persist_dir (str): 벡터 DB 저장 경로
            embedding_fn: 임베딩 함수 (기본값: None)
            force_new (bool): True일 경우 기존 DB를 삭제하고 새로 생성 (X)
            collection_name (str): 컬렉션 이름 (기본값: "guidelines")
        """
        if embedding_fn is None:
            embedding_fn = Embedder()
            
        self.db = Chroma(
            persist_directory=persist_dir,
            embedding_function=embedding_fn,
            collection_name=collection_name
        )
        self._guideline_cache = {}  # 가이드라인 캐시
        
    @classmethod
    def create_unified_db(cls, persist_dir: str = "unified_db", **kwargs):
        """통합된 가이드라인을 저장하는 벡터 DB 생성"""
        return cls(persist_dir=persist_dir, collection_name="unified_guidelines", **kwargs)
    
    @classmethod
    def create_parts_db(cls, persist_dir: str = "parts_db", **kwargs):
        """가이드라인 부분들을 저장하는 벡터 DB 생성"""
        return cls(persist_dir=persist_dir, collection_name="guideline_parts", **kwargs)

    def add_unified_chunks(self, chunks: List[Dict[str, Any]]):
        """통합된 가이드라인 청크 추가"""
        texts = []
        metadatas = []
        for chunk in chunks:
            texts.append(chunk["text"])
            metadatas.append(chunk["metadata"])
            # 캐시 업데이트
            self._guideline_cache[chunk["metadata"]["full_id"]] = {
                "title": chunk["metadata"]["title"],
                "category_name": chunk["metadata"]["category_name"],
                "url": chunk["metadata"]["url"]
            }
        self.add(texts, metadatas)

    def add_part_chunks(self, chunks: List[Dict[str, Any]]):
        """가이드라인 부분 청크 추가"""
        texts = []
        metadatas = []
        for chunk in chunks:
            texts.append(chunk["text"])
            metadatas.append(chunk["metadata"] | {"chunk_type": chunk["type"]})
            # 캐시 업데이트
            self._guideline_cache[chunk["metadata"]["full_id"]] = {
                "title": chunk["metadata"].get("title", ""),
                "category_name": chunk["metadata"]["category_name"],
                "url": chunk["metadata"]["url"]
            }
        self.add(texts, metadatas)

    def add(self, texts: List[str], metas: List[Dict[str, Any]] = None):
        """
        텍스트와 메타데이터를 벡터 DB에 추가
        
        Args:
            texts (List[str]): 임베딩할 텍스트 리스트
            metas (List[Dict]): 메타데이터 리스트
        """
        if metas is None:
            metas = [{}] * len(texts)
        self.db.add_texts(texts, metadatas=metas)

    def as_retriever(self, k: int = 1): # TOP-K
        """벡터 DB를 retriever로 변환"""
        return self.db.as_retriever(search_kwargs={"k": k})

    def delete(self, ids: List[str]):
        """지정된 ID의 문서들을 삭제"""
        self.db.delete(ids)

    def add_chunks(self, chunks: List[Dict[str, Any]]):
        """
        청크 리스트를 벡터 DB에 추가
        
        Args:
            chunks (List[Dict]): GuidelineChunker에서 생성된 청크 리스트
        """
        texts = []
        metadatas = []
        
        for chunk in chunks:
            # 메인 가이드라인 정보 캐시
            if chunk["type"] == "main":
                self._guideline_cache[chunk["metadata"]["full_id"]] = {
                    "title": chunk["text"].split("\n")[0].replace("Guideline: ", ""),
                    "category_name": chunk["metadata"]["category_name"],
                    "url": chunk["metadata"]["url"]
                }
            
            texts.append(chunk["text"])
            metadatas.append(chunk["metadata"] | {"chunk_type": chunk["type"]})
        
        self.add(texts, metadatas)

    def search_similar(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """
        쿼리와 가장 유사한 가이드라인을 검색
        
        Args:
            query (str): 검색 쿼리
            k (int): 반환할 결과 수
            
        Returns:
            List[Dict]: 검색 결과 리스트. 각 결과는 가이드라인 정보와 관련 청크를 포함
        """
        print("유사도검색 시작합니다.")
        results = self.db.similarity_search_with_score(query, k=k*2)  # 더 많은 결과를 가져와서 필터링
        
        # 결과를 가이드라인별로 그룹화
        guideline_groups = {}
        for doc, score in results:
            metadata = doc.metadata
            full_id = metadata.get("full_id", "unknown")
            
            if full_id not in guideline_groups:
                # 캐시된 가이드라인 정보 사용
                cache_info = self._guideline_cache.get(full_id, {})
                
                guideline_groups[full_id] = {
                    "guideline_id": full_id,
                    "title": metadata.get("title", cache_info.get("title", "")),
                    "category_name": metadata.get("category_name", cache_info.get("category_name", "")),
                    "url": metadata.get("url", cache_info.get("url", "")),
                    "score": score,
                    "content": doc.page_content,  # 통합 버전에서 사용
                    "related_chunks": []  # 부분 버전에서 사용
                }
            
            # 부분 버전인 경우에만 청크 정보 추가
            if "chunk_type" in metadata:
                guideline_groups[full_id]["related_chunks"].append({
                    "type": metadata["chunk_type"],
                    "content": doc.page_content,
                    "score": score
                })
            
            # 통합 버전인 경우 점수 업데이트 (더 좋은 점수로)
            elif score < guideline_groups[full_id]["score"]:
                guideline_groups[full_id]["score"] = score
                guideline_groups[full_id]["content"] = doc.page_content
        
        # 점수로 정렬하여 상위 k개 반환
        sorted_results = sorted(guideline_groups.values(), key=lambda x: x["score"])
        return sorted_results[:k]

    def clear(self):
        """벡터 DB의 모든 데이터를 삭제"""
        self.db._collection.delete(where={})
        self._guideline_cache.clear()

    def get_collection_stats(self) -> Dict[str, int]:
        """벡터 DB 컬렉션 통계 반환"""
        count = self.db._collection.count()
        return {
            "total_documents": count
        }

if __name__ == "__main__":
    # 통합 벡터 DB 테스트
    unified_db = VectorDBManager.create_unified_db(persist_dir="unified_db")
    loader = InputGuidelineLoader("data/guidelines.json")
    guideline_json = loader.load_all()
    
    # 청크 생성 및 저장
    chunker = GuidelineChunker(guideline_json)
    unified_chunks = chunker.chunk_unified()
    
    # 통합 버전 벡터 DB 초기화
    print("\n[3/5] 벡터 DB 초기화 중...")
    unified_db = VectorDBManager.create_unified_db(persist_dir="unified_db", force_new=True)
    print("✓ 벡터 DB 생성 완료")
    
    print("\n청크 임베딩 및 저장 중...")
    unified_db.add_unified_chunks(unified_chunks)
    print("✓ 청크 임베딩 및 저장 완료")
    
    # 검색 테스트
    print("\n=== 검색 테스트 ===")
    test_query = "웹사이트 성능 최적화"
    results = unified_db.search_similar(test_query, k=3)
    
    for result in results:
        print(f"\n[가이드라인 {result['guideline_id']}] {result['title']}")
        print(f"카테고리: {result['category_name']}")
        print(f"URL: {result['url']}")
        print(f"유사도 점수: {result['score']:.4f}")
        print(f"\n내용:\n{result['content'][:500]}...")
    
    # 테스트 코드
    vectordb = VectorDBManager(persist_dir="guideline_db")
    loader = InputGuidelineLoader("data/guidelines.json")
    guideline_json = loader.load_all()
    
    # 청크 생성 및 저장
    chunker = GuidelineChunker(guideline_json)
    chunks = chunker.chunk()
    
    print("\n=== 가이드라인 벡터 DB 저장 테스트 ===")
    print(f"총 {len(chunks)}개의 청크 처리 중...")
    
    vectordb.add_chunks(chunks)
    print("저장 완료")
    
    # 검색 테스트
    print("\n=== 검색 테스트 ===")
    test_query = "웹사이트 성능 최적화"
    results = vectordb.search_similar(test_query, k=3)
    
    for result in results:
        print(f"\n[가이드라인 {result['guideline_id']}] {result['title']}")
        print(f"카테고리: {result['category_name']}")
        print(f"URL: {result['url']}")
        print(f"유사도 점수: {result['score']:.4f}")
        
        print("\n관련 청크:")
        for chunk in result["related_chunks"]:
            print(f"\n- {chunk['type']}:")
            print(f"  {chunk['content'][:200]}...")
