# 1. 핵심 기능:
- WSG 가이드라인 데이터 처리 및 Vector DB 저장
- 웹사이트 리소스(HTML) 수집 및 분석
- Vector 유사도 검색을 통한 가이드라인 매칭
- Gemini를 활용한 평가 및 결과 생성
- Firestore에 결과 저장

# 2. 기술스택:
- FastAPI (웹 프레임워크)
- ChromaDB 또는 Milvus (Vector Database)
- Google Gemini API (AI 평가)
- Firebase Firestore (결과 저장)
- BeautifulSoup4 (HTML 파싱)
- sentence-transformers (텍스트 임베딩)

# 3. 구현 계획:
Phase 1 - 기본 설정 및 데이터 준비
- FastAPI 프로젝트 구조 설정
- WSG 가이드라인 데이터 처리
- Vector DB 연동
- MVP 용 웹사이트: 1. 환경부 (https://me.go.kr/home/web/main.do), 2. 행정안전부 (https://www.mois.go.kr/frt/a01/frtMain.do), 3. 정부24 (https://www.gov.kr/portal/main/nologin)

Phase 2 - 핵심 기능 구현
- 웹사이트 리소스 수집 기능
- Vector 유사도 검색 구현
- Gemini API 연동
- 평가 결과 저장 기능

Phase 3 - API 엔드포인트 구현
- 웹사이트 평가 요청 API
- 결과 조회 API

# 어떻게 웹사이트를 W3c의 wsg 가이드라인을 평가할 것인가
1. Download the wsg_guildlines.json, wsg_star.json from w3c's wsg Github [Done]

2. Download the website's resources like html,js.[Done]

3. wsg_guildenes.json , wsg_star.json 를
가이드라인 번호 별로 나누고, vector DB 에 저장 [ ] 

4. example.com 의 html, (js), (css), (img) 를 청크로 나눠서 VectorDB와 유사도 검색을 진행한다. 
(mvp 는 일단 html만 진행합니다.)[ ] 

5. 해당 유사도 검색 결과를 통해 유사도가 높은 데이터 쌍들을 얻는다. (n개) 그리고 top-k 로 가장 좋은 유사도가 높은 k개를 찾는다.
(데이터 구조=  html : 가이드라인 번호 )[ ] 

6. 유사도가 높은 k개의 데이터쌍 데이터를 Gemini에게 보내서 결정 이유를 확인한다.(이때 전혀 관계없는지도 한번 확인합니다.)
그리고 자연어 결과를 얻습니다. (패스/불통과) [ ]

7. 해당 데이터를 DB에 저장합니다. FireStore에 저장 [ ]

# 실제 코드 구현 (Gemini api call이 너무 많아지면 시간도 오래걸리고, 아직 테스트 단계니 MVP 버전으로 만든다. 즉 여러 가이드라인이 있어도 2번째인 webdevelopment 기준으로 진행한다. 여러가지 리소스가 있겠지만 html만 한정짓는다.) 
- json sustainable 가이드라인 embeding 모델로 Vector Db에 저장하기 
- N-th Query Embedding 하고 에 저장하기

# Directory Structure
api
├── core/
│   ├── config.py           # 환경 설정
│   └── exceptions.py       # 커스텀 예외 처리
├── services/
│   ├── resources_loader.py (website의 리소스 가져오기) 
│   ├── gemini_service.py ((gemini 2.0 flash))
│   ├── vector_db.py (vector_db (embeding code))
│   └── wsg_report.py (wsg report 생성)
├── models/
│   ├── website.py         # 웹사이트 모델
│   ├── guideline.py       # 가이드라인 모델
│   └── report.py         # 리포트 모델
├── utils/
│   ├── html_parser.py    # HTML 파싱 유틸리티
│   └── validators.py     # 입력 검증

# 추가적으로 확장 할 수 있는 부분 
- 점수화 시스템 (가이드라인 준수 정도)
- 시각적 보고서 생성 (react로 만들 순 있음.)
- 경쟁사 벤치마킹(이거는 아주 나중에..)