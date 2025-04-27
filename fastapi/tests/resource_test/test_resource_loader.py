import pytest
import asyncio
from api.services.wsg_evaluator import WSGEvaluator
from api.utils.html_parser import HTMLParser
from api.services.resources_loader import ResourceLoader

'''
python -m pytest tests/resource_test/test_resource_loader.py -v

or you want to see the debug log, execute the following command.
(-s or --capture=no options.)
python -m pytest -v -s tests/resource_test/test_resource_loader.py
'''
@pytest.mark.asyncio
async def test_resource_loading_and_analysis():
    """리소스 로딩, HTML 구조 분석, 가이드라인 필터링을 테스트합니다."""
    
    # 테스트할 URL (실제 존재하는 웹사이트)
    test_url = "https://www.me.go.kr"
    
    # WSGEvaluator 인스턴스 생성
    evaluator = WSGEvaluator()
    
    # 1. 웹사이트 리소스 로드 테스트
    chunks = await evaluator.resource_loader.load_website_content(test_url)
    assert chunks is not None
    assert isinstance(chunks, list)
    assert len(chunks) > 0
    assert all(isinstance(chunk, dict) for chunk in chunks)
    print(f"\n1. Resource Loading - Success")
    print(f"Number of chunks: {len(chunks)}")
    
    # 2. HTML 구조 분석 테스트
    structure_data = evaluator.html_parser.extract_page_structure(chunks[0]['content'])
    assert structure_data is not None
    assert isinstance(structure_data, dict)
    print("\n2. HTML Structure Analysis - Success")
    print("Structure data keys:", structure_data.keys())
    
    # 3. 관련 가이드라인 필터링 테스트
    relevant_guidelines = evaluator._filter_relevant_guidelines(structure_data)
    assert relevant_guidelines is not None
    assert isinstance(relevant_guidelines, list)
    print("\n3. Guideline Filtering - Success")
    print(f"Found {len(relevant_guidelines)} relevant guidelines")
    
    # 상세 정보 출력
    print("\nDetailed Analysis:")
    print("=" * 50)
    print("HTML Structure:")
    for key, value in structure_data.items():
        if isinstance(value, (list, dict)):
            print(f"{key}: {len(value)} items")
        else:
            print(f"{key}: {value}")
    
    print("\nRelevant Guidelines:")
    for guideline in relevant_guidelines[:3]:  # 처음 3개만 출력
        print(f"- {guideline.get('guideline', 'No title')} (ID: {guideline.get('id', 'No ID')})")

if __name__ == "__main__":
    asyncio.run(test_resource_loading_and_analysis())
