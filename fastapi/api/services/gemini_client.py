from typing import Dict, List, Any, Optional
import google.generativeai as genai
from api.core.config import settings
import json

class GeminiClient:
    """Gemini API를 사용하여 WSG 가이드라인 준수 여부를 분석하는 클라이언트"""
    
    def __init__(self):
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel('gemini-pro')
        
    def _create_analysis_prompt(
        self,
        structure_data: Dict[str, Any],
        url: str,
        guidelines: List[Dict[str, Any]]
    ) -> str:
        """분석을 위한 프롬프트를 생성합니다."""
        prompt = f"""
You are a Web Sustainability Guidelines (WSG) expert. Analyze the following website structure data and evaluate its compliance with the provided WSG guidelines.

Website URL: {url}

Structure Data:
{json.dumps(structure_data, indent=2)}

Relevant WSG Guidelines:
{json.dumps(guidelines, indent=2)}

Provide a detailed analysis including:
1. Overall compliance assessment
2. Specific guideline evaluations with confidence scores (0-1)
3. Recommendations for improvement
4. Areas requiring manual review

Format your response as a JSON object with the following structure:
{
    "overall_assessment": {
        "compliance_score": float,  // 0-1
        "summary": string
    },
    "guideline_evaluations": [
        {
            "guideline_id": string,
            "compliance": boolean,
            "confidence": float,  // 0-1
            "evidence": string,
            "recommendations": [string]
        }
    ],
    "manual_review_needed": [
        {
            "guideline_id": string,
            "reason": string
        }
    ],
    "improvement_priorities": [
        {
            "guideline_id": string,
            "priority": "high|medium|low",
            "impact": string
        }
    ]
}

Ensure your analysis is based on concrete evidence from the structure data and follows WSG principles."""
        
        return prompt
    
    async def analyze_wsg_compliance(
        self,
        structure_data: Dict[str, Any],
        url: str,
        guidelines: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        웹사이트의 WSG 가이드라인 준수 여부를 분석합니다.
        
        Args:
            structure_data: HTML 구조 분석 데이터
            url: 분석 대상 웹사이트 URL
            guidelines: 관련 WSG 가이드라인 목록
            
        Returns:
            분석 결과를 포함한 딕셔너리
        """
        try:
            # 프롬프트 생성
            prompt = self._create_analysis_prompt(structure_data, url, guidelines)
            
            # Gemini API 호출
            response = await self.model.generate_content_async(prompt)
            
            # 응답 파싱
            try:
                analysis = json.loads(response.text)
            except json.JSONDecodeError:
                # JSON 파싱 실패 시 텍스트 응답을 구조화된 형태로 변환
                analysis = {
                    'overall_assessment': {
                        'compliance_score': 0,
                        'summary': 'Failed to parse Gemini response'
                    },
                    'error': response.text
                }
            
            return analysis
            
        except Exception as e:
            return {
                'error': f"WSG 분석 중 오류 발생: {str(e)}",
                'overall_assessment': {
                    'compliance_score': 0,
                    'summary': 'Analysis failed due to error'
                }
            }
