from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime

class GuidelineCriteria(BaseModel):
    """WSG 가이드라인의 평가 기준"""
    title: str = Field(..., description="평가 기준 제목")
    testable: str = Field(..., description="테스트 가능 여부 (Machine-testable/Human-testable)")
    description: str = Field(..., description="평가 기준 설명")

class GuidelineBenefits(BaseModel):
    """가이드라인 준수 시 얻을 수 있는 이점"""
    Environmental: Optional[str] = None
    Privacy: Optional[str] = None
    Social_Equity: Optional[str] = None
    Accessibility: Optional[str] = None
    Performance: Optional[str] = None
    Economic: Optional[str] = None
    Conversion: Optional[str] = None

class GuidelineGRI(BaseModel):
    """GRI(Global Reporting Initiative) 영향도"""
    materials: str = Field(..., description="재료 영향도")
    energy: str = Field(..., description="에너지 영향도")
    water: str = Field(..., description="물 영향도")
    emissions: str = Field(..., description="배출 영향도")

class GuidelineExample(BaseModel):
    """가이드라인 예시"""
    content: str = Field(..., description="예시 내용")

class Guideline(BaseModel):
    """WSG 가이드라인"""
    id: str = Field(..., description="가이드라인 ID")
    url: HttpUrl = Field(..., description="가이드라인 URL")
    guideline: str = Field(..., description="가이드라인 제목")
    criteria: List[GuidelineCriteria] = Field(..., description="평가 기준 목록")
    intent: str = Field(..., description="가이드라인의 의도")
    impact: str = Field(..., description="영향도 (Low/Medium/High)")
    effort: str = Field(..., description="구현 난이도 (Low/Medium/High)")
    benefits: List[GuidelineBenefits] = Field(..., description="기대되는 이점들")
    GRI: List[GuidelineGRI] = Field(..., description="GRI 영향도")
    example: Optional[List[GuidelineExample]] = Field(default_factory=list, description="예시 목록")
    resources: Optional[Dict[str, HttpUrl]] = Field(default_factory=dict, description="참고 자료")
    tags: List[str] = Field(..., description="관련 태그")

class GuidelineCategory(BaseModel):
    """WSG 가이드라인 카테고리"""
    id: str = Field(..., description="카테고리 ID")
    name: str = Field(..., description="카테고리 이름")
    shortName: Optional[str] = Field(None, description="카테고리 짧은 이름")
    guidelines: List[Guideline] = Field(..., description="카테고리에 속한 가이드라인 목록")

class WSGDocument(BaseModel):
    """WSG 문서 전체 구조"""
    title: str = Field(..., description="문서 제목")
    version: str = Field(..., description="문서 버전")
    edition: str = Field(..., description="문서 에디션")
    lastModified: datetime = Field(..., description="마지막 수정일")
    category: List[GuidelineCategory] = Field(..., description="카테고리 목록")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Web Sustainability Guidelines",
                "version": "1.0",
                "edition": "Editor's Draft",
                "lastModified": "2025-04-07",
                "category": [
                    {
                        "id": "1",
                        "name": "Web Development",
                        "shortName": "Web Dev",
                        "guidelines": [
                            {
                                "id": "1",
                                "url": "https://w3c.github.io/sustainableweb-wsg/#example",
                                "guideline": "Example Guideline",
                                "criteria": [
                                    {
                                        "title": "Example Criteria",
                                        "testable": "Machine-testable",
                                        "description": "Example description"
                                    }
                                ],
                                "intent": "Example intent",
                                "impact": "Medium",
                                "effort": "Low",
                                "benefits": [
                                    {
                                        "Environmental": "Example benefit",
                                        "Performance": "Example performance benefit"
                                    }
                                ],
                                "GRI": [
                                    {
                                        "materials": "Medium",
                                        "energy": "Medium",
                                        "water": "Medium",
                                        "emissions": "Medium"
                                    }
                                ],
                                "tags": ["Performance", "Environmental"]
                            }
                        ]
                    }
                ]
            }
        }