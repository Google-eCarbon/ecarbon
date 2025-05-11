from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# 라우터 임포트
from app.routers import wsg, vector_search, guidelines

# FastAPI 앱 초기화
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Web Sustainability Guidelines (WSG) 준수 여부를 평가하는 API",
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(wsg.router, prefix=settings.API_V1_STR)
app.include_router(vector_search.router, prefix=settings.API_V1_STR)
app.include_router(guidelines.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():

    return {
        "message": "WSG Evaluation API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
