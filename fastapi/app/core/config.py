from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "WSG Evaluation API"
    VERSION: str = "1.0.0"
    
    # CORS 설정
    CORS_ORIGINS: List[Union[str, AnyHttpUrl]] = ["*"]
    
    # Google Cloud 설정
    GOOGLE_CLOUD_PROJECT: str = os.getenv("GOOGLE_CLOUD_PROJECT", "woven-province-411903")
    GOOGLE_APPLICATION_CREDENTIALS: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "../config/vertexAccountKey.json")
    
    # API 키
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    
    # 데이터 경로
    GUIDELINES_PATH: str = os.getenv("GUIDELINES_PATH", "data/wsg_guidelines.json")
    
    # Vector Search 설정
    VECTOR_INDEX_ID: str = "unified_guidelines_index"
    VECTOR_DIMENSIONS: int = 1536
    VECTOR_DISTANCE_MEASURE: str = "DOT_PRODUCT_DISTANCE"
    
    # 기타 설정
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    class Config:
        case_sensitive = True
        env_file = ".env"

# 설정 인스턴스 생성
settings = Settings()
