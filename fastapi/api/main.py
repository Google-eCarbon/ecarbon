from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import wsg

app = FastAPI(
    title="WSG Evaluation API",
    description="Web Sustainability Guidelines (WSG) 준수 여부를 평가하는 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 운영 환경에서는 구체적인 origin 지정 필요
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(wsg.router)

@app.get("/")
async def root():
    return {
        "message": "WSG Evaluation API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
