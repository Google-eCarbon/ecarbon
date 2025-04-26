from typing import Dict, List, Optional
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime

class WebsiteResource(BaseModel):
    """웹사이트의 리소스를 나타내는 모델"""
    type: str = Field(..., description="리소스 타입 (html, css, js, image 등)")
    url: HttpUrl = Field(..., description="리소스의 URL")
    content: str = Field(..., description="리소스의 내용")
    size: int = Field(..., description="리소스의 크기 (bytes)")
    last_modified: Optional[datetime] = Field(None, description="리소스의 마지막 수정 시간")

class WebsiteAnalysisResult(BaseModel):
    """웹사이트의 WSG 가이드라인 분석 결과를 나타내는 모델"""
    guideline_id: str = Field(..., description="가이드라인 ID")
    compliant: bool = Field(..., description="가이드라인 준수 여부")
    confidence: float = Field(..., ge=0, le=1, description="분석 결과의 신뢰도")
    explanation: str = Field(..., description="분석 결과에 대한 설명")
    suggestions: List[str] = Field(default_factory=list, description="개선을 위한 제안사항")
    resource_matches: List[str] = Field(default_factory=list, description="관련된 리소스 URL들")

class Website(BaseModel):
    """웹사이트 정보를 나타내는 모델"""
    url: HttpUrl = Field(..., description="웹사이트의 URL")
    name: Optional[str] = Field(None, description="웹사이트의 이름")
    resources: Dict[str, WebsiteResource] = Field(
        default_factory=dict, 
        description="웹사이트의 리소스들 (key: resource URL)"
    )
    analysis_results: List[WebsiteAnalysisResult] = Field(
        default_factory=list,
        description="WSG 가이드라인 분석 결과들"
    )
    analyzed_at: Optional[datetime] = Field(None, description="분석 완료 시간")
    
    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://example.com",
                "name": "Example Website",
                "resources": {
                    "https://example.com/index.html": {
                        "type": "html",
                        "url": "https://example.com/index.html",
                        "content": "<!DOCTYPE html><html>...</html>",
                        "size": 1024,
                        "last_modified": "2024-04-26T10:00:00Z"
                    }
                },
                "analysis_results": [
                    {
                        "guideline_id": "2.1.1",
                        "compliant": True,
                        "confidence": 0.95,
                        "explanation": "웹사이트가 최적화된 이미지를 사용하고 있습니다.",
                        "suggestions": [],
                        "resource_matches": ["https://example.com/index.html"]
                    }
                ],
                "analyzed_at": "2024-04-26T10:30:00Z"
            }
        }