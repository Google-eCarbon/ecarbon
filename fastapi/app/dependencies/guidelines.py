from app.services.guideline_service import GuidelineService
from app.core.config import settings
from functools import lru_cache

@lru_cache()
def get_guideline_service() -> GuidelineService:
    """
    가이드라인 서비스 인스턴스를 반환하는 의존성 함수
    캐싱을 통해 애플리케이션 수명 동안 단일 인스턴스 유지
    """
    guideline_service = GuidelineService(
        guidelines_path=settings.GUIDELINES_PATH
    )
    return guideline_service
