import os
from dotenv import load_dotenv
import google.generativeai as genai

# .env 파일에서 API 키 불러오기
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

# API 키 설정
genai.configure(api_key=API_KEY)

# 모델 초기화
model = genai.GenerativeModel("gemini-2.0-flash")

# 프롬프트에 대한 응답 생성
response = model.generate_content("15 + 27은 얼마일까요?")
print(response.text)
