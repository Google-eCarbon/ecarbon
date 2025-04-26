from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    # API 설정
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "WSG Guidelines Evaluator"
    
    # Vector DB 설정
    CHROMA_PERSIST_DIRECTORY: str = "chroma_db"
    
    # Gemini API 설정
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    
    # Firebase 설정
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    
    # WSG 데이터 설정
    WSG_GUIDELINES_PATH: str = "wsg_data/wsg_guidelines.json"
    WSG_STAR_PATH: str = "wsg_data/wsg_star.json"
    
    # 평가 설정
    TOP_K_MATCHES: int = 5  # Vector 검색에서 반환할 상위 매칭 수
    SIMILARITY_THRESHOLD: float = 0.5  # 유사도 임계값

settings = Settings()