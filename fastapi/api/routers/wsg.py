from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any, Optional
from pydantic import BaseModel, HttpUrl
from api.services.wsg_evaluator import WSGEvaluator
from datetime import datetime

router = APIRouter(
    prefix="/wsg",
    tags=["WSG Evaluation"]
)

class WSGEvaluationRequest(BaseModel):
    url: HttpUrl
    options: Optional[Dict[str, Any]] = None

class WSGEvaluationResponse(BaseModel):
    request_id: str
    url: HttpUrl
    status: str
    timestamp: datetime
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# 진행 중인 평가 작업을 추적하기 위한 저장소
evaluation_tasks: Dict[str, Dict[str, Any]] = {}

@router.post("/evaluate", response_model=WSGEvaluationResponse)
async def evaluate_website(request: WSGEvaluationRequest, background_tasks: BackgroundTasks):
    """
    웹사이트의 WSG 가이드라인 준수 여부를 평가합니다.
    
    - **url**: 평가할 웹사이트의 URL
    - **options**: 평가 옵션 (선택사항)
    """
    try:
        # 요청 ID 생성
        request_id = f"wsg_eval_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(evaluation_tasks)}"
        
        # 초기 상태 저장
        evaluation_tasks[request_id] = {
            "url": str(request.url),
            "status": "pending",
            "timestamp": datetime.now(),
            "result": None
        }
        
        # 백그라운드에서 평가 실행
        background_tasks.add_task(
            _run_evaluation,
            request_id=request_id,
            url=str(request.url),
            options=request.options
        )
        
        return WSGEvaluationResponse(
            request_id=request_id,
            url=request.url,
            status="pending",
            timestamp=datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"평가 요청 처리 중 오류 발생: {str(e)}"
        )

@router.get("/status/{request_id}", response_model=WSGEvaluationResponse)
async def get_evaluation_status(request_id: str):
    """평가 작업의 현재 상태를 조회합니다."""
    if request_id not in evaluation_tasks:
        raise HTTPException(
            status_code=404,
            detail=f"요청 ID를 찾을 수 없음: {request_id}"
        )
    
    task = evaluation_tasks[request_id]
    return WSGEvaluationResponse(
        request_id=request_id,
        url=task["url"],
        status=task["status"],
        timestamp=task["timestamp"],
        result=task["result"],
        error=task.get("error")
    )

async def _run_evaluation(request_id: str, url: str, options: Optional[Dict[str, Any]] = None):
    """백그라운드에서 WSG 평가를 실행합니다."""
    try:
        evaluator = WSGEvaluator()
        result = await evaluator.evaluate_url(url)
        
        evaluation_tasks[request_id].update({
            "status": "completed",
            "result": result
        })
        
    except Exception as e:
        evaluation_tasks[request_id].update({
            "status": "failed",
            "error": str(e)
        })
