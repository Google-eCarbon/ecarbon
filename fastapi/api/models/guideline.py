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
                                "guideline": "Example Guideline (ex:Set goals based on potential impact considerations)",
                                "criteria": [ # criteria는 많을 수 있음. 
                                    {
                                        "title": "Example Criteria ex:Performance goals",
                                        "testable": "Machine-testable (ex:[Machine-testable](https://w3c.github.io/sustainableweb-wsg/star.html#WD01-1)",
                                        "description": "Example description (ex: Explicit goals that impact the environment and performance of the service, for example, HTTP requests, or the amount of DOM elements that need to be rendered are both set and met.)"
                                    },
                                    {
                                    "title": "Performance goals",
                                    "testable": "[Machine-testable](https://w3c.github.io/sustainableweb-wsg/star.html#WD01-1)",
                                    "description": "Explicit goals that impact the environment and performance of the service, for example, HTTP requests, or the amount of DOM elements that need to be rendered are both set and met."
                                    },
                                    {
                                    "title": "Accountancy types",
                                    "testable": "[Machine-testable](https://w3c.github.io/sustainableweb-wsg/star.html#WD01-2)",
                                    "description": "Because the payload being delivered may not always be equal in terms of energy intensity, operators of websites and applications must ensure that consideration is given for the energy intensity (or unit being evaluated) of each component. For example, non-rendering text is less computational than CSS, which in turn is less process-heavy than JavaScript, which is less resource-heavy than WebGL."
                                    }
                                ],
                                "intent": "Example intent (ex:Performance is a key part of the sustainability mindset as reductions in loading times can have a considerable impact on energy loads within CPU, GPU, RAM, and hard drive caching (among other variables), as such ensuring a performant product is essential.)",
                                "impact": "Medium",
                                "effort": "Low",
                                "benefits": [
                                    { # 무조건 다 포함되어있는것은 아님 (==> nullable)
                                        "Environmental": "Limiting the number of server requests and the size of the DOM decreases a product or service's environmental impact by reducing CPU and GPU cycles, and RAM usage which benefits energy consumption, reducing the need to recharge devices as frequently.",
                                        "Performance": "Reducing the hardware utilization as denoted above will also improve performance metrics, as a device will suffer less consumption and thrashing of limited resources.",
                                        "Conversion": "Search engines consider web performance in their ranking data, as such a faster website may lead to a higher rank and potentially better conversion rates."
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
                                "example": [
                                    {
                                        "code": "!function(e,t){\"use strict\";\"object\"==typeof module&&\"object\"==typeof module.exports?module.exports=e.document?t(e,!0):function(e){if(!e.document)throw new Error(\"jQuery requires a window with a document\");return t(e)}:t(e)}(\"undefined\"!=typeof window?window:this,function(g,e){\"use strict\";var t=[],r=Object.getPrototypeOf,s=t.slice,v=t.flat?function(e){return t.flat.call(e)}:function(e){return t.concat.apply([],e)},u=t.push,i=t.indexOf",
                                        "content": "A large list of ways to speed up your website within the front-end performance [checklist](https://www.smashingmagazine.com/2021/01/front-end-performance-2021-free-pdf-checklist/)."
                                    }
                                ], # tags 는 안에 뭐가 들어있을 지 예상 불가가
                                "tags": ["Performance", "Environmental","HTML", "CSS", "JavaScript", "Performance"]
                            }
                        ]
                    }
                ]
            }
        # ... (rest of the code) max id is 5