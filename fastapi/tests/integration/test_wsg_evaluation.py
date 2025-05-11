import pytest
import asyncio
from typing import Dict, Any
from api.services.wsg_evaluator import WSGEvaluator
from api.services.vector_db import VectorDBService
from api.utils.html_chunker import HTMLChunker

'''
통합 테스트 실행 방법:
python -m pytest tests/integration/test_wsg_evaluation.py -v

디버그 로그를 보려면:
python -m pytest -v -s tests/integration/test_wsg_evaluation.py
'''

@pytest.fixture(scope="module")
def vector_db():
    """테스트에 사용할 VectorDB 인스턴스를 생성하고 가이드라인을 로드합니다."""
    db = VectorDBService()
    db.load_guidelines()
    return db

@pytest.fixture(scope="module")
def html_chunker():
    """테스트에 사용할 HTMLChunker 인스턴스를 생성합니다."""
    return HTMLChunker()

@pytest.mark.asyncio
async def test_full_website_evaluation():
    """전체 웹사이트 평가 프로세스를 테스트합니다."""
    
    # 테스트용 URL
    test_url = "https://me.go.kr/home/web/main.do"
    
    try:
        # WSGEvaluator 인스턴스 생성
        evaluator = WSGEvaluator()
        
        # 1. 전체 평가 실행
        result = await evaluator.evaluate_website(test_url)
        assert result is not None
        assert isinstance(result, dict)
        
        print("\n1. Website Evaluation - Success")
        print(f"Compliance Score: {result.get('compliance_score', 0):.2f}")
        
        # 2. 리소스 통계 확인
        resource_stats = result.get('resource_stats', {})
        print("\nResource Statistics:")
        print(f"Total Size: {resource_stats.get('total_size_kb', 0):,} KB")
        print(f"HTML Size: {resource_stats.get('html_size_kb', 0):,} KB")
        print(f"CSS Size: {resource_stats.get('css_size_kb', 0):,} KB")
        print(f"JS Size: {resource_stats.get('js_size_kb', 0):,} KB")
        print(f"Image Size: {resource_stats.get('image_size_kb', 0):,} KB")
        print(f"Total Requests: {resource_stats.get('total_requests', 0)}")
        
        # 3. 구조 통계 확인
        structure_stats = result.get('structure_stats', {})
        print("\nStructure Statistics:")
        for key, value in structure_stats.items():
            if isinstance(value, dict):
                print(f"\n{key}:")
                for k, v in value.items():
                    print(f"  {k}: {v}")
            else:
                print(f"{key}: {value}")
        
        # 4. 가이드라인 평가 결과 확인
        evaluations = result.get('evaluations', [])
        print(f"\nGuideline Evaluations ({len(evaluations)} items):")
        for eval in evaluations[:5]:  # 상위 5개만 출력
            print(f"\n- Guideline {eval['guideline_id']}:")
            print(f"  Impact: {eval['impact']}, Effort: {eval['effort']}")
            print(f"  Violations ({len(eval['violations'])} found):")
            for violation in eval['violations']:
                print(f"    * {violation['explanation'][:100]}...")
                if violation.get('fixed_code'):
                    print(f"    * Suggested Fix: {violation['fixed_code'][:100]}...")
    
    except Exception as e:
        print(f"\nError during evaluation: {str(e)}")
        raise

@pytest.mark.asyncio
async def test_html_chunking(html_chunker):
    """HTML 청킹 기능을 테스트합니다."""
    
    # 테스트용 HTML
    test_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Page</title>
    </head>
    <body>
        <header>
            <h1>Welcome</h1>
            <nav>
                <ul>
                    <li><a href="#">Home</a></li>
                    <li><a href="#">About</a></li>
                </ul>
            </nav>
        </header>
        <main>
            <article>
                <h2>Article Title</h2>
                <p>This is a test paragraph with some content.</p>
                <img src="test.jpg" alt="Test Image">
            </article>
        </main>
        <footer>
            <p>&copy; 2025 Test Site</p>
        </footer>
    </body>
    </html>
    """
    
    try:
        # 청킹 실행
        chunks = html_chunker.chunk_html(test_html)
        assert chunks is not None
        assert isinstance(chunks, list)
        
        print("\nHTML Chunking Test - Success")
        print(f"Generated {len(chunks)} chunks")
        
        # 청크 상세 정보 출력
        for i, chunk in enumerate(chunks):
            print(f"\nChunk {i + 1}:")
            print(f"Tag: {chunk['tag']}")
            print(f"Tokens: {chunk['tokens']}")
            print(f"Attributes: {chunk['attributes']}")
            print(f"Text Preview: {chunk['text'][:100].encode('ascii', 'ignore').decode()}")
    
    except Exception as e:
        print(f"\nError during chunking: {str(e)}")
        raise

@pytest.mark.asyncio
async def test_vector_search(vector_db):
    """Vector DB 검색 기능을 테스트합니다."""
    
    try:
        # 테스트용 태그맵
        test_tag_map = {
            "img": 5,
            "video": 2,
            "script": 3,
            "link": 4,
            "style": 2
        }
        
        # 가이드라인 검색
        guidelines = vector_db.find_relevant_guidelines(
            url="test_url",
            tag_map=test_tag_map,
            top_k=5
        )
        
        assert guidelines is not None
        assert isinstance(guidelines, list)
        
        print("\nVector Search Test - Success")
        print(f"Found {len(guidelines)} relevant guidelines")
        
        # 검색 결과 출력
        for i, guideline in enumerate(guidelines):
            print(f"\nGuideline {i + 1}:")
            print(f"ID: {guideline['guideline_id']}")
            print(f"Weight: {guideline['weight']:.2f}")
            print(f"Tags: {', '.join(guideline['tags'])}")
    
    except Exception as e:
        print(f"\nError during vector search: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(test_full_website_evaluation())
