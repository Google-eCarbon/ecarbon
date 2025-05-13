from app.services.vectordb_manager import VectorDBManager
from app.core.config import settings
from functools import lru_cache

@lru_cache()
def get_vector_db() -> VectorDBManager:
    """
    Vector DB 인스턴스를 반환하는 의존성 함수
    캐싱을 통해 애플리케이션 수명 동안 단일 인스턴스 유지
    """
    vector_db = VectorDBManager(
        project_id=settings.GOOGLE_CLOUD_PROJECT,
        location="us-central1",
        index_id=settings.VECTOR_INDEX_ID,
        dimensions=settings.VECTOR_DIMENSIONS,
        distance_measure_type=settings.VECTOR_DISTANCE_MEASURE
    )
    return vector_db
