from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

from app.services.evaluator import evaluate_with_llm
from app.services.database import DatabaseManager
from app.services.vector_db import VectorDBManager, initialize_vector_db
from app.services.guideline_loader import InputGuidelineLoader
from app.utils.get_html import get_html_file
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Web Sustainability Guidelines Evaluation API",
    description="웹사이트의 지속가능성 가이드라인 준수 여부를 평가하는 API",
    version="1.0.0"
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],  # React 개발 서버와 모든 출처 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 요청/응답 모델
class WebsiteEvaluationRequest(BaseModel):
    url: HttpUrl
    similarity_threshold: Optional[float] = 0.7

class GuidelineEvaluation(BaseModel):
    guideline_id: str
    title: str
    category_name: str
    url: str
    similarity_score: float
    content: str
    evaluations: Optional[List[dict]] = None

class WebsiteEvaluationResponse(BaseModel):
    evaluation_id: str
    url: str
    timestamp: datetime
    evaluations: List[GuidelineEvaluation]

# 서비스 인스턴스
db = DatabaseManager()
vector_db = VectorDBManager.create_unified_db()
guideline_loader = InputGuidelineLoader("data/wsg_guidelines.json")

@app.post("/wsg/evaluate")
async def evaluate_website_endpoint(
    request: WebsiteEvaluationRequest,
    background_tasks: BackgroundTasks
):
    """웹사이트의 HTML 컨텐츠를 가이드라인과 비교하여 평가합니다."""
    try:
        print(f"Received evaluation request for URL: {request.url}")
        
        # 1. 기존 결과 확인
        url_str = str(request.url)
        print(f"Checking existing results for URL: {url_str}")
        existing_id = db.get_test_result_by_url(url_str)
        
        if existing_id:
            print(f"Found existing evaluation: {existing_id}")
            return {
                "evaluation_id": existing_id,
                "url": url_str,
                "timestamp": datetime.now(),
                "message": "Existing evaluation found. Use GET /wsg/evaluations/{evaluation_id} to check results."
            }

        # 2. 새로운 평가 시작
        print("Starting new evaluation...")
        # HTML 컨텐츠 가져오기
        try:
            html_content = get_html_file(url_str)
            if not html_content:
                raise HTTPException(status_code=400, detail="Failed to fetch HTML content")
            print(f"Successfully fetched HTML content for {url_str}")
        except Exception as e:
            print(f"Error fetching HTML: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Failed to fetch HTML content: {str(e)}")

        # 데이터베이스에 테스트 결과 생성
        try:
            test_result_id = db.create_test_result(url_str, html_content)
            print(f"Created test result with ID: {test_result_id}")
        except Exception as e:
            print(f"Database error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

        # 유사한 가이드라인 검색
        try:
            similar_guidelines = vector_db.search_similar(
                html_content,
                k=2  # 상위 1개 가이드라인
            )
            print(f"Found {len(similar_guidelines)} similar guidelines")
        except Exception as e:
            print(f"Vector search error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Vector search error: {str(e)}")

        # 각 가이드라인에 대해 LLM 평가 수행
        for guideline in similar_guidelines:
            print(f"Adding evaluation task for guideline: {guideline['guideline_id']}")
            background_tasks.add_task(
                evaluate_with_llm,
                test_result_id=test_result_id,
                html_content=html_content,
                guideline_content=guideline["content"],
                test_file_title=url_str,
                guideline_id=guideline["guideline_id"]
            )

        return {
            "evaluation_id": test_result_id,
            "url": url_str,
            "timestamp": datetime.now(),
            "message": "Evaluation started. Use GET /evaluations/{evaluation_id} to check results."
        }

    except Exception as e:
        print(f"Unexpected error in evaluate_website_endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/wsg/evaluations/{evaluation_id}")
async def get_evaluation_results(evaluation_id: str):
    """특정 평가 ID에 대한 결과를 조회합니다."""
    try:
        results = db.get_evaluation_results(evaluation_id)
        if not results:
            raise HTTPException(status_code=404, detail="Evaluation not found")

        # 결과를 응답 모델 형식으로 변환
        evaluations = []
        for eval_result in results["evaluations"]:
            guideline = next(
                (g for g in vector_db.search_similar(eval_result["relevant_code"], k=1)
                if g["guideline_id"] == eval_result["guideline_id"]),
                None
            )
            if guideline:
                evaluations.append(GuidelineEvaluation(
                    guideline_id=eval_result["guideline_id"],
                    title=guideline["title"],
                    category_name=guideline["category_name"],
                    url=guideline["url"],
                    similarity_score=guideline["score"],
                    content=guideline["content"],
                    evaluations=[{
                        "relevant_code": eval_result["relevant_code"],
                        "violation": eval_result["violation"],
                        "explanation": eval_result["explanation"],
                        "corrected_code": eval_result["corrected_code"]
                    }]
                ))

        return WebsiteEvaluationResponse(
            evaluation_id=evaluation_id,
            url=results["url"],
            timestamp=results["timestamp"],
            evaluations=evaluations
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/wsg/guidelines/similar")
async def find_similar_guidelines(
    html_content: str,
    threshold: float = 0.7,
    top_k: int = 2
):
    """HTML 컨텐츠와 유사한 가이드라인을 검색합니다."""
    try:
        similar_guidelines = vector_db.search_similar(
            html_content,
            k=top_k
        )
        return {"guidelines": similar_guidelines}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 벡터 DB 초기화"""
    try:
        initialize_vector_db()
    except Exception as e:
        print(f"Failed to initialize vector DB: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)