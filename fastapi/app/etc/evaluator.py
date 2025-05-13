from pydantic import BaseModel, Field
from langchain.output_parsers import StructuredOutputParser
from langchain.prompts import ChatPromptTemplate
import sqlite3
import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI

class EvaluationResult(BaseModel):
    relevant_code: str = Field(description="The code snippet from the input that is relevant to the guideline")
    violation: str = Field(description="'Yes' if the code violates the guideline, 'No' if it doesn't")
    explanation: str = Field(description="Detailed explanation of why the code violates or complies with the guideline")
    corrected_code: str = Field(description="If there's a violation, provide the corrected code. If no violation, write 'Not applicable'")

def create_chain(model_name, use_groq=False, use_claude=False, use_openai=False, use_google=False):
    """LLM 체인 생성"""
    # 파서 구성
    parser = StructuredOutputParser.from_response_schemas([
        {
            "name": "relevant_code",
            "description": "The code snippet from the input that is relevant to the guideline",
            "type": "string"
        },
        {
            "name": "violation",
            "description": "'Yes' if the code violates the guideline, 'No' if it doesn't",
            "type": "string"
        },
        {
            "name": "explanation",
            "description": "Detailed explanation of why the code violates or complies with the guideline",
            "type": "string"
        },
        {
            "name": "corrected_code",
            "description": "If there's a violation, provide the corrected code. If no violation, write 'Not applicable'",
            "type": "string"
        }
    ])
    
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

    prompt = ChatPromptTemplate.from_template(template)

    if use_google:
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=0,
            google_api_key="AIzaSyDBfptxKS2F2IuCZ2C8htra-c0bw1R5vog"
        )
    
    # 체인 생성
    chain = prompt | llm
    
    return chain, parser

def evaluate_code(code: str, guideline: str, model_name, use_groq=False, use_claude=False, use_openai=False, use_google=False) -> EvaluationResult:
    """코드와 가이드라인을 평가"""
    chain, parser = create_chain(model_name, use_groq, use_claude, use_openai, use_google)
    response = chain.invoke({
        "code": code,
        "guideline": guideline
    })
    
    # AIMessage 객체에서 content 추출
    content = response.content if hasattr(response, 'content') else str(response)
    
    # 응답 정리 및 파싱
    try:
        # 응답에서 JSON 부분만 추출
        content = content.strip()
        if content.startswith('```json'):
            content = content[7:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        # print("\n=== LLM 응답 디버깅 ===")
        # print("정제된 응답:")
        # print(content)
        # print("\n응답 문자 분석:")
        # for i, char in enumerate(content):
        #     if char in ['"', "'", "}", "{", ","]:
        #         print(f"위치 {i}: '{char}'")
        # print("=" * 30)
        
        # JSON 파싱 시도
        try:
            parsed_dict = json.loads(content)
        except json.JSONDecodeError as e:
            print(f"\nJSON 파싱 오류 상세:")
            print(f"오류 메시지: {str(e)}")
            print(f"오류 위치: line {e.lineno}, column {e.colno}")
            print(f"오류 문자: '{content[e.pos]}'")
            print(f"문맥:")
            start = max(0, e.pos - 20)
            end = min(len(content), e.pos + 20)
            print(content[start:end])
            print(" " * (e.pos - start) + "^")
            raise
        
        # 필수 필드 확인
        required_fields = ["relevant_code", "violation", "explanation", "corrected_code"]
        missing_fields = [field for field in required_fields if field not in parsed_dict]
        if missing_fields:
            raise ValueError(f"다음 필드가 누락됨: {', '.join(missing_fields)}")
        
        return EvaluationResult(
            relevant_code=parsed_dict["relevant_code"],
            violation=parsed_dict["violation"],
            explanation=parsed_dict["explanation"],
            corrected_code=parsed_dict["corrected_code"]
        )
        
    except Exception as e:
        print(f"파싱 오류: {str(e)}")
        print(f"LLM 응답: {content}")
        raise
