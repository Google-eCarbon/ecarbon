# Vertex AI 임포트 방식 변경
import google.cloud.aiplatform as aiplatform
from google.cloud.aiplatform import MatchingEngineIndex
from google.cloud.aiplatform import MatchingEngineIndexEndpoint
from typing import List, Dict, Any
import os
import time
from resources_loader import InputGuidelineLoader
from chunker import GuidelineChunker
from embedder import Embedder
from typing import Dict, Any, List, Tuple
import json
import vertexai
from google.oauth2 import service_account

# 환경 변수에서 프로젝트 ID 가져오기
project_id = os.environ.get('GOOGLE_CLOUD_PROJECT', 'woven-province-411903')

# 서비스 계정 키 파일 경로 확인
service_account_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', '../config/vertexAccountKey.json')

try:
    # 서비스 계정 인증 정보 생성
    credentials = service_account.Credentials.from_service_account_file(service_account_path)
    
    # Vertex AI 초기화
    vertexai.init(
        project=project_id,
        location='us-central1',  # 기본 리전
        credentials=credentials
    )
    print(f"Vertex AI 초기화 성공: 프로젝트 ID {project_id}")
except Exception as e:
    print(f"Vertex AI 초기화 실패: {e}")
'''
가이드라인 JSON 구조 → 사람이 읽을 수 있는 자연어 묶음으로 통합 → 벡터 임베딩 → 유사도 기반 검색
'''
class VectorDBManager:
    def __init__(self, project_id: str = None, location: str = None, index_id: str = None):
        """Vertex AI Vector Search 관리자 초기화
        
        Args:
            project_id (str): Google Cloud 프로젝트 ID
            location (str): 리전 (예: us-central1)
            index_id (str): Vector Search 인덱스 ID
        """
        self.project_id = project_id or os.getenv('GOOGLE_CLOUD_PROJECT') or 'woven-province-411903'
        self.location = location or 'us-central1'
        self.index_id = index_id
        
        # Vertex AI는 이미 모듈 레벨에서 초기화되었으므로 여기서는 생략
        print(f"Using project: {self.project_id}, location: {self.location}, index: {self.index_id}")
        
        # Vector Search 인덱스 생성 또는 가져오기
        self.index = self._get_or_create_index()
        
    def _get_or_create_index(self):
        """색인이 있는지 확인하고 없으면 생성"""
        print(f"Using project: {self.project_id}, location: {self.location}, index: {self.index_id}")
        
        try:
            # 기존 색인 가져오기 시도
            try:
                # 기존 색인 ID 사용 - 공식 문서에 따른 메서드 사용
                # 색인 ID를 직접 지정하는 경우
                index_id = "9034152682784292864"
                self.index = aiplatform.MatchingEngineIndex(index_id)
                print(f"Using existing index: {index_id}")
                return self.index
            except Exception as e:
                print(f"Error loading existing index: {e}")
                print("Falling back to creating a new index")
            
            # 색인이 없으면 색인 생성
            print(f"Creating tree AH index with dimensions={self.dimensions}, approximate_neighbors_count={self.approximate_neighbors_count}")
            
            # 색인 생성 (공식 문서에 따라 생성)
            print("Creating MatchingEngineIndex")
            
            # 저장소 URI 생성 (Cloud Storage 경로)
            contents_delta_uri = f"gs://{self.bucket_name}/{self.index_id}"
            
            # 공식 문서에 따른 색인 생성 방법 사용
            index = aiplatform.MatchingEngineIndex.create_tree_ah_index(
                display_name=self.index_id,
                contents_delta_uri=contents_delta_uri,
                dimensions=self.dimensions,
                approximate_neighbors_count=self.approximate_neighbors_count,
                distance_measure_type=self.distance_measure_type
            )
            
            print(f"Index created: {index.name}")
            self.index = index
            return self.index
        except Exception as e:
            print(f"Error creating index: {e}")
            # 오류 발생 시 목업 검색 사용
            print("Using mock index for fallback")
            
    def _create_mock_response(self):
        """Mock 응답 생성"""
        from unittest.mock import MagicMock
        response = MagicMock()
        response.matches = []
        return response
            
    @classmethod
    def check_index_exists(cls, project_id: str = None, location: str = None, index_id: str = "unified_guidelines_index"):
        """인덱스가 이미 존재하는지 확인"""
        print(f"this is your project ID: {os.environ.get('GOOGLE_CLOUD_PROJECT')}")
        try:
            project_id = project_id or os.environ.get('GOOGLE_CLOUD_PROJECT') or 'woven-province-411903'
            location = location or 'us-central1'
            print(f"this is your project ID: {project_id}")
            # 인덱스 이름 형식: projects/{project}/locations/{location}/indexes/{index_id}
            index_name = f"projects/{project_id}/locations/{location}/indexes/{index_id}"
            
            try:
                # 인덱스 객체 생성 시도 - 존재하지 않으면 예외 발생
                MatchingEngineIndex(index_name=index_name)
                return True
            except Exception:
                return False
        except Exception:
            return False
    
    @classmethod
    def create_unified_db(cls, project_id: str = None, location: str = None, index_id: str = "unified_guidelines_index"):
        """통합 가이드라인 Vector Search 인덱스 생성
        
        Args:
            project_id (str): Google Cloud 프로젝트 ID
            location (str): 리전
            index_id (str): 인덱스 ID
            
        Returns:
            VectorDBManager: Vector Search 관리자 인스턴스
        """
        return cls(
            project_id=project_id,
            location=location,
            index_id=index_id
        )
    
    @classmethod
    def create_parts_db(cls, project_id: str = None, location: str = None) -> 'VectorDBManager':
        """가이드라인 부분들을 저장하는 Vector Search 인덱스 생성
        
        Args:
            project_id (str): Google Cloud 프로젝트 ID
            location (str): 리전
            
        Returns:
            VectorDBManager: Vector Search 관리자 인스턴스
        """
        return cls(
            project_id=project_id,
            location=location,
            index_id='guideline-parts'
        )

    def add_unified_chunks(self, chunks: List[Dict[str, Any]]):
        """가이드라인 청크를 Vector Search에 추가"""
        print(f"Adding {len(chunks)} chunks to vector search...")
        
        # 임베딩 생성
        embedder = Embedder()
        embeddings = embedder.embed_documents([chunk['text'] for chunk in chunks])
        print("Embeddings generated successfully")
        
        # 임베딩 데이터 저장 (디버그용)
        import pickle
        import os
        os.makedirs('vector_data', exist_ok=True)
        with open('vector_data/embeddings.pkl', 'wb') as f:
            pickle.dump({
                'chunks': chunks,
                'embeddings': embeddings
            }, f)
        print("Data saved to vector_data/embeddings.pkl for debugging")
        
        try:
            # Cloud Storage에 임베딩 업로드
            import json
            import tempfile
            from google.cloud import storage
            
            # 임시 파일 생성
            temp_dir = tempfile.mkdtemp()
            temp_file_path = os.path.join(temp_dir, 'embeddings.json')
            
            # 임베딩을 JSONL 형식으로 저장
            with open(temp_file_path, 'w') as f:
                for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                    data = {
                        "id": f"chunk_{i}",
                        "embedding": embedding.tolist(),  # numpy array를 list로 변환
                        "restricts": {
                            "text": chunk['text'],
                            "metadata": str(chunk['metadata'])
                        }
                    }
                    f.write(json.dumps(data) + '\n')
            
            # Cloud Storage에 업로듀
            bucket_name = f"{self.project_id}-vector-data"
            blob_name = f"embeddings-{int(time.time())}.json"
            gcs_uri = f"gs://{bucket_name}/{blob_name}"
            
            try:
                # 버킷 생성 시도
                storage_client = storage.Client()
                try:
                    bucket = storage_client.get_bucket(bucket_name)
                except Exception:
                    print(f"Creating new bucket: {bucket_name}")
                    bucket = storage_client.create_bucket(bucket_name, location=self.location)
                
                # 파일 업로드
                blob = bucket.blob(blob_name)
                blob.upload_from_filename(temp_file_path)
                print(f"Uploaded embeddings to {gcs_uri}")
                
                # 색인 생성 또는 업데이트
                if not self.index:
                    print("Creating new index...")
                    self.index = aiplatform.MatchingEngineIndex.create_tree_ah_index(
                        display_name=f"unified-guidelines-index-{int(time.time())}",
                        contents_delta_uri=gcs_uri,
                        dimensions=len(embeddings[0]),  # 첫 번째 임베딩의 차원 수
                        approximate_neighbors_count=10,
                        distance_measure_type="COSINE_DISTANCE"
                    )
                    print(f"Created new index: {self.index.name}")
                else:
                    print(f"Updating existing index: {self.index.name}")
                    self.index.update_embeddings(contents_delta_uri=gcs_uri)
                
                # 임시 파일 삭제
                os.remove(temp_file_path)
                os.rmdir(temp_dir)
                
                print(f"Successfully processed {len(chunks)} chunks")
                
            except Exception as e:
                print(f"Error in Cloud Storage operations: {e}")
                raise
            
        except Exception as e:
            print(f"Error processing chunks: {e}")
            raise
            
        # 색인 엔드포인트 사용 (공식 문서 방식)
        try:
            # 기존 엔드포인트 가져오기 시도
            try:
                # 엔드포인트 ID 직접 지정 (공식 문서 방식)
                endpoint_id = "6196533073819992064"
                self.index_endpoint = aiplatform.MatchingEngineIndexEndpoint(endpoint_id)
                print(f"Using existing index endpoint: {endpoint_id}")
            except Exception as e:
                print(f"Error loading index endpoint: {e}")
                print("Creating new index endpoint...")
                # 새 엔드포인트 생성 시도
                try:
                    self.index_endpoint = aiplatform.MatchingEngineIndexEndpoint.create(
                        display_name=f"{self.index_id}-endpoint",
                        public_endpoint_enabled=True
                    )
                    print(f"Created new index endpoint: {self.index_endpoint.name}")
                except Exception as e:
                    print(f"Error creating index endpoint: {e}")
                    print("Falling back to mock search implementation")
                    self.index_endpoint = None
                    return
            
            # 배포 ID는 문자로 시작하고 문자, 숫자, 언더스코어만 포함해야 함
            # 더 단순한 형식으로 수정
            deployed_index_id = "deployed_index"
            try:
                # 이미 배포되었는지 확인
                deployed_indexes = self.index_endpoint.deployed_indexes
                if not any(di.id == deployed_index_id for di in deployed_indexes):
                    print(f"Deploying index to endpoint...")
                    self.index_endpoint.deploy_index(
                        index=self.index,
                        deployed_index_id=deployed_index_id
                    )
                    print(f"Index deployed as {deployed_index_id}")
                else:
                    print(f"Index already deployed as {deployed_index_id}")
            except Exception as e:
                print(f"Warning: Could not deploy index: {e}")
        except Exception as e:
            print(f"Warning: Could not create/verify index endpoint: {e}")
        
        # 데이터 저장 (디버그용)
        import pickle
        import os
        os.makedirs('vector_data', exist_ok=True)
        with open('vector_data/embeddings.pkl', 'wb') as f:
            pickle.dump({
                'chunks': chunks,
                'embeddings': embeddings
            }, f)
        print("Data saved to vector_data/embeddings.pkl for debugging")
        
        print(f"Vector data processing complete. Use index.name to reference: {self.index.name}")


    def search_similar(self, query, k: int = 5) -> List[Dict[str, Any]]:
        """
        쿼리와 가장 유사한 가이드라인을 검색
        
        Args:
            query: 검색 쿼리 (문자열 또는 청크 데이터)
            k (int): 반환할 결과 수
            
        Returns:
            List[Dict]: 검색 결과 리스트. 각 결과는 가이드라인 정보와 관련 청크를 포함
        """
        print("유사도검색 시작합니다.")
        
        try:
            # 쿼리 처리 - 문자열 또는 청크 데이터를 처리
            embedder = Embedder()
            
            # 쿼리가 디셔너리나 청크 데이터인 경우 처리
            if isinstance(query, dict):
                print("딕셔너리이거나 청크데이터임")
                # 청크에서 'text' 키가 있는지 확인
                if 'text' in query:
                    query_text = query['text']
                else:
                    # 기본 키를 찾아서 사용
                    for key in ['content', 'chunk', 'html_content', 'value']:
                        if key in query:
                            query_text = query[key]
                            break
                    else:
                        # 적절한 키를 찾지 못한 경우 문자열화
                        query_text = str(query)
            else:
                print("문자열임")
                # 문자열인 경우 그대로 사용
                query_text = str(query)
                
            # 쿼리 임베딩 생성
            query_embedding = embedder.embed_query(query_text)
            
            # 색인 엔드포인트 확인
            try:
                # 색인 엔드포인트가 있는지 확인
                if not hasattr(self, 'index_endpoint') or self.index_endpoint is None:
                    # 색인 엔드포인트 가져오기 시도
                    from google.cloud import aiplatform
                    # 기존 엔드포인트 ID 사용 (공식 문서 방식)
                    endpoint_id = "6196533073819992064"
                    try:
                        self.index_endpoint = aiplatform.MatchingEngineIndexEndpoint(endpoint_id)
                        print(f"Using existing index endpoint: {endpoint_id}")
                    except Exception as e:
                        print(f"Could not find index endpoint: {e}")
                        # 목업 검색 사용
                        return self._mock_search(query_text, k)
                
                # 배포된 색인 ID 확인
                # 배포 ID는 문자로 시작하고 문자, 숫자, 언더스코어만 포함해야 함
                # 더 단순한 형식으로 수정
                deployed_index_id = "deployed_index"
                # 재시도 로직 추가
                max_retries = 3
                retry_count = 0
                retry_delay = 2  # 초
                
                while retry_count < max_retries:
                    try:
                        print(f"Searching in deployed index: {deployed_index_id} (attempt {retry_count + 1}/{max_retries})")
                        # 배포된 색인에서 검색 시도
                        response = self.index_endpoint.find_neighbors(
                            deployed_index_id=deployed_index_id,
                            queries=[query_embedding],  # 쿼리는 리스트로 전달
                            num_neighbors=k*2  # 더 많은 결과를 가져와서 필터링
                        )
                        # 성공하면 루프 종료
                        break
                    except Exception as e:
                        retry_count += 1
                        if retry_count >= max_retries:
                            # 모든 재시도 실패
                            raise e
                        print(f"Attempt {retry_count}/{max_retries} failed: {e}. Retrying in {retry_delay} seconds...")
                        import time
                        time.sleep(retry_delay)
                        # 다음 재시도에서 더 긴 대기 시간
                        retry_delay *= 2
                
                # 결과를 가이드라인별로 그룹화
                guideline_groups = {}
                
                # 반환된 결과가 없으면 빈 리스트 반환
                if not response or len(response) == 0 or not response[0]:
                    print("No matches found in vector search")
                    return []
                    
                # 최신 API에서는 결과가 다른 형태로 반환됨
                matches = response[0]  # 첫 번째 쿼리에 대한 결과
                
                for neighbor in matches:
                    try:
                        # 색인 ID와 거리 값 추출
                        id_value = neighbor.id
                        distance = neighbor.distance
                        
                        # 저장된 데이터에서 메타데이터 가져오기
                        import pickle
                        try:
                            with open('vector_data/embeddings.pkl', 'rb') as f:
                                data = pickle.load(f)
                                chunks = data.get('chunks', [])
                                
                                # 일치하는 청크 찾기
                                matching_chunk = None
                                for i, chunk in enumerate(chunks):
                                    if f'chunk_{i}' == id_value:
                                        matching_chunk = chunk
                                        break
                                
                                if matching_chunk:
                                    metadata = matching_chunk.get('metadata', {})
                                    full_id = metadata.get("full_id", "unknown")
                                    
                                    if full_id not in guideline_groups:
                                        guideline_groups[full_id] = {
                                            "guideline_id": full_id,
                                            "title": metadata.get("title", ""),
                                            "category_name": metadata.get("category_name", ""),
                                            "url": metadata.get("url", ""),
                                            "score": distance,
                                            "content": matching_chunk.get('text', ""),
                                            "related_chunks": []
                                        }
                                    
                                    # 부분 버전인 경우에만 청크 정보 추가
                                    if "chunk_type" in metadata:
                                        guideline_groups[full_id]["related_chunks"].append({
                                            "type": metadata["chunk_type"],
                                            "content": matching_chunk.get('text', ""),
                                            "score": distance
                                        })
                                    
                                    # 통합 버전인 경우 점수 업데이트 (더 좋은 점수로)
                                    elif distance < guideline_groups[full_id]["score"]:
                                        guideline_groups[full_id]["score"] = distance
                                        guideline_groups[full_id]["content"] = matching_chunk.get('text', "")
                        except Exception as e:
                            print(f"Error loading stored data: {e}")
                            
                    except Exception as e:
                        print(f"Error processing match: {e}")
                        continue
            except Exception as e:
                print(f"Error using index endpoint: {e}")
                # 목업 검색 사용
                return self._mock_search(query_text, k)
                
        except Exception as e:
            print(f"Error during vector search: {e}")
            # 오류 발생 시 빈 결과 반환
            return []
        
        # 점수로 정렬하여 상위 k개 반환
        sorted_results = sorted(guideline_groups.values(), key=lambda x: x["score"])
        return sorted_results[:k]
        
    def _mock_search(self, query_text: str, k: int) -> List[Dict[str, Any]]:
        """목업 검색 구현 - 색인 엔드포인트가 없을 때 사용"""
        print("Using mock search implementation")
        
        try:
            # 저장된 데이터에서 청크 및 임베딩 가져오기
            import pickle
            import numpy as np
            
            try:
                with open('vector_data/embeddings.pkl', 'rb') as f:
                    data = pickle.load(f)
                    chunks = data.get('chunks', [])
                    embeddings = data.get('embeddings', [])
                    
                if not chunks or not embeddings:
                    print("No stored chunks or embeddings found")
                    return []
                    
                # 쿼리 임베딩 생성
                embedder = Embedder()
                query_embedding = embedder.embed_query(query_text)
                
                # 코사인 유사도 계산
                def cosine_similarity(a, b):
                    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
                
                # 각 청크와의 유사도 계산
                similarities = []
                for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                    try:
                        sim = cosine_similarity(query_embedding, embedding)
                        similarities.append((i, chunk, 1.0 - sim))  # 거리로 변환 (1 - 유사도)
                    except Exception as e:
                        print(f"Error calculating similarity for chunk {i}: {e}")
                
                # 거리순 정렬
                similarities.sort(key=lambda x: x[2])
                
                # 결과를 가이드라인별로 그룹화
                guideline_groups = {}
                
                for i, chunk, distance in similarities[:k*2]:
                    try:
                        metadata = chunk.get('metadata', {})
                        full_id = metadata.get("full_id", "unknown")
                        
                        if full_id not in guideline_groups:
                            guideline_groups[full_id] = {
                                "guideline_id": full_id,
                                "title": metadata.get("title", ""),
                                "category_name": metadata.get("category_name", ""),
                                "url": metadata.get("url", ""),
                                "score": distance,
                                "content": chunk.get('text', ""),
                                "related_chunks": []
                            }
                        
                        # 부분 버전인 경우에만 청크 정보 추가
                        if "chunk_type" in metadata:
                            guideline_groups[full_id]["related_chunks"].append({
                                "type": metadata["chunk_type"],
                                "content": chunk.get('text', ""),
                                "score": distance
                            })
                        
                        # 통합 버전인 경우 점수 업데이트 (더 좋은 점수로)
                        elif distance < guideline_groups[full_id]["score"]:
                            guideline_groups[full_id]["score"] = distance
                            guideline_groups[full_id]["content"] = chunk.get('text', "")
                    except Exception as e:
                        print(f"Error processing chunk {i}: {e}")
                        continue
                
                # 점수로 정렬하여 상위 k개 반환
                sorted_results = sorted(guideline_groups.values(), key=lambda x: x["score"])
                return sorted_results[:k]
                
            except Exception as e:
                print(f"Error loading stored data: {e}")
                return []
                
        except Exception as e:
            print(f"Error during mock search: {e}")
            return []

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