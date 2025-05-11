"""Gemini API를 사용하여 웹사이트를 평가하는 클라이언트"""
import google.generativeai as genai
from typing import List, Dict, Any
import os
from pydantic import BaseModel, Field
from langchain.prompts import ChatPromptTemplate
import os
from langchain_google_genai import ChatGoogleGenerativeAI

class GeminiClient:
    def __init__(self):
        """Gemini 클라이언트 초기화"""
        # API 키 설정 - 환경변수로 설정하는 것이 좋지만 테스트를 위해 임시로 하드코딩
        api_key = "AIzaSyDBfptxKS2F2IuCZ2C8htra-c0bw1R5vog"
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        # LangChain 모델 초기화
        self.llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
    
    async def evaluate_guideline(self, guideline_id: str, html_content: str, chunks: List[str]) -> List[Dict[str, Any]]:
        
            # 프롬프트 템플릿 생성
        template = """You are an expert in web sustainability guidelines. Analyze the following code snippet against the provided guideline.

                Code:
                {code}

                Guideline:
                {guideline}

                Provide your analysis in a strict JSON format with the following fields:
                1. "relevant_code": Extract and quote the relevant code snippet from the input
                2. "violation": Must be exactly "Yes" or "No"
                3. "explanation": Your detailed explanation
                4. "corrected_code": If violation is "Yes", provide corrected code. If "No", write "Not applicable"

                IMPORTANT:
                - Use proper JSON formatting with quotes around string values
                - Include ALL four fields in your response
                - Make sure there are no trailing commas
                - Each field should be on a new line
                - Do not include any text outside the JSON object

                Example of correct format:
                {{
                    "relevant_code": "example code here",
                    "violation": "No",
                    "explanation": "This code complies because...",
                    "corrected_code": "Not applicable"
                }}

                Your response (in strict JSON format):"""

        """가이드라인에 따라 HTML 콘텐츠를 평가합니다."""
        prompt = ChatPromptTemplate.from_template(template)

        
        try:
            response = await self.model.generate_content(prompt)
            result = response.text
            
            # 응답 파싱
            violations = []
            if "준수" not in result:
                # 위반 사항이 있는 경우
                lines = result.split('\n')
                current_violation = {}
                
                for line in lines:
                    line = line.strip()
                    if line.startswith('- 위치:'):
                        if current_violation:
                            violations.append(current_violation)
                        current_violation = {'location': line[7:].strip()}
                    elif line.startswith('- 설명:'):
                        current_violation['description'] = line[7:].strip()
                    elif line.startswith('- 수정 방안:'):
                        current_violation['suggestion'] = line[10:].strip()
                
                if current_violation:
                    violations.append(current_violation)
            
            return violations
            
        except Exception as e:
            print(f"Error evaluating guideline {guideline_id}: {str(e)}")
            return []
    
    def evaluate_code(self, code: str, guideline: str, model_name: str = 'gemini-1.5-flash'):
        """HTML 코드와 가이드라인을 평가하여 결과를 반환합니다."""
        try:
            # 프롬프트 템플릿 생성
            template = """
            You are an expert in web sustainability guidelines. Analyze the following code snippet against the provided guideline.

            Code:
            {code}

            Guideline:
            {guideline}

            Provide your analysis in a strict JSON format with the following fields:
            1. "relevant_code": Extract and quote the relevant code snippet from the input
            2. "violation": Must be exactly "Yes" or "No"
            3. "explanation": Your detailed explanation
            4. "corrected_code": If violation is "Yes", provide corrected code. If "No", write "Not applicable"
            """
            
            # 프롬프트 템플릿 생성
            prompt = ChatPromptTemplate.from_template(template)
            
            # 체인 실행
            chain = prompt | self.llm
            
            # 결과 반환
            response = chain.invoke({"code": code, "guideline": guideline})
            return response
        except Exception as e:
            print(f"Error evaluating code: {str(e)}")
            # 임시 객체 반환 (오류 발생 시)
            return type('obj', (object,), {
                'relevant_code': '<div>Example code</div>',
                'violation': '접근성 위반 사항',
                'explanation': '오류 발생: ' + str(e),
                'corrected_code': '<div><img src="example.jpg" alt="설명"></div>'
            })
