import pytest
from api.services.wsg_evaluator import WSGEvaluator

'''
python -m pytest tests/resource_test/test_resource_loader.py -v

or you want to see the debug log, execute the following command.
(-s or --capture=no options.)
python -m pytest -v -s tests/resource_test/test_resource_loader.py
'''
@pytest.mark.asyncio
async def test_resource_loading_and_analysis():
    """리소스 로딩, HTML 구조 분석, 가이드라인 필터링을 테스트합니다."""
    
    # 테스트용 URL (한국어 사이트)
    test_url = "https://me.go.kr/home/web/main.do"  # 대한민국 정부 포털
    
    # WSGEvaluator 인스턴스 생성
    evaluator = WSGEvaluator()
    
    # 1. 웹사이트 리소스 로드 테스트
    site_resource = await evaluator.resource_loader.load_website_content(test_url)
    assert site_resource is not None
    
    print("\n1. Resource Loading - Success")
    print(f"Total resources: {len(site_resource.resources)}")
    print(f"\nResource sizes:")
    print(f"HTML: {site_resource.stats.html_size:,} bytes")
    print(f"CSS: {site_resource.stats.css_size:,} bytes")
    print(f"JS: {site_resource.stats.js_size:,} bytes")
    print(f"Total: {site_resource.stats.total_size:,} bytes")
    
    print(f"\nDOM Statistics:")
    print(f"Total nodes: {site_resource.stats.total_nodes}")
    print(f"Max depth: {site_resource.stats.max_depth}")
    print(f"Images: {site_resource.stats.images_count}")
    print(f"Forms: {site_resource.stats.forms_count}")
    print(f"Links: {site_resource.stats.links_count}")
    
    print(f"\nTag Map:")
    for tag, count in sorted(site_resource.stats.tag_map.items()):
        print(f"{tag}: {count}")
    
    # 2. HTML 구조 분석 테스트
    structure_data = evaluator.html_parser.extract_page_structure(site_resource.raw_html)
    assert structure_data is not None
    assert isinstance(structure_data, dict)
    print("\n2. HTML Structure Analysis - Success")
    print("Structure data keys:", structure_data.keys())
    print("Structure data values:", structure_data.values())
    
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
    
    print("\nRelevant Guidelines (Top 5):")
    for guideline in relevant_guidelines[:5]:
        print(f"- {guideline['guideline']} (ID: {guideline['id']})")
        print(f"  Impact: {guideline['impact']}, Effort: {guideline['effort']}, Weight: {guideline['weight']:.2f}")
        print(f"  Matching Tags: {', '.join(guideline['matching_tags'])}")
        print()

if __name__ == "__main__":
    asyncio.run(test_resource_loading_and_analysis())
