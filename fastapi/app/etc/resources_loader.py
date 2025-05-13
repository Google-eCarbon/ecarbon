import re
from typing import Dict, List, Any, Set
from urllib.parse import urljoin, urlparse
import aiohttp
from bs4 import BeautifulSoup
import lxml.html
from pathlib import Path
import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
from typing import Dict, List, Any, Set

class SiteResource:
    def __init__(self, url: str, content: str = None, type: str = None, size: int = 0):
        self.url = url
        self.content = content
        self.type = type
        self.size = size
        self.dom_depth = 0
        self.dom_elements = 0
        self.dom_text_nodes = 0
        self.dom_attributes = 0
        self.resource_urls = set()
        self.resources = {}
        self.raw_html = None
        self.dom = None
        # DOM 통계를 저장할 속성 추가
        class Stats:
            def __init__(self):
                self.total_nodes = 0
                self.max_depth = 0
                self.text_nodes = 0
                self.attributes = 0
                self.tag_counts = {}
                self.html_size = 0
                self.css_size = 0
                self.js_size = 0
                self.total_size = 0
        
        self.stats = Stats()

class InputTestSuiteHtmlLoader:
    """data/test_suite 폴더의 모든 HTML 파일을 읽어서 텍스트로 반환"""

    def __init__(self, folder: str):
        self.folder = Path(folder)

    def load_all(self) -> List[str]:
        if not self.folder.exists():
            raise FileNotFoundError(self.folder)
        html_list = []
        for fp in sorted(self.folder.glob("*.html")):
            html_list.append(fp.read_text(encoding="utf-8"))
        return html_list

class InputGuidelineLoader:
    """data/guidelines.json 파일을 읽어서 JSON 객체로 반환"""

    def __init__(self, file_path: str):
        print(f"\n=== Guideline Loader Initialization ===")
        print(f"File path: {file_path}")
        self.file_path = Path(file_path)
        self._data = None

    def load_all(self) -> Dict[str, Any]:
        print("\n=== Loading Guideline Data ===")
        if not self.file_path.exists():
            print(f"Error: File not found - {self.file_path}")
            raise FileNotFoundError(self.file_path)
        if self._data is None:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                self._data = json.load(f)
                print("Guideline data loaded successfully")
                print(f"Number of categories: {len(self._data.get('category', []))}")
        return self._data

    def _get_category_id_from_prefix(self, file_prefix: str) -> Optional[str]:
        """파일 prefix로부터 카테고리 ID 결정"""
        # 카테고리 ID 매핑
        prefix_map = {
            'BSPM': '5',  # Business Strategy And Product Management
            'UX': '2',    # User Experience
            'WD': '3',    # Web Design
            'HIS': '4'    # Hosting Infrastructure Services
        }
        
        # 파일 prefix 추출 (예: BSPM01-1 -> BSPM)
        main_prefix = ''.join(c for c in file_prefix if c.isalpha())
        print(f"Extracted main prefix: {main_prefix}")
        
        category_id = prefix_map.get(main_prefix)
        if category_id:
            print(f"Mapped to category ID: {category_id}")
        else:
            print(f"Warning: No category mapping for {main_prefix}")
        
        return category_id

    def get_guideline_for_test_file(self, test_file: str) -> Tuple[Optional[str], Optional[Dict]]:
        """테스트 파일명으로부터 해당하는 가이드라인과 criteria, intent, benefits, example, tags 반환"""
        print(f"\n=== Finding guideline for test file: {test_file} ===")
        
        # 파일 prefix 추출 (예: BSPM01-1.html -> BSPM01-1)
        file_prefix = test_file.split('.')[0]
        print(f"File prefix: {file_prefix}")
        
        try:
            # 파일명을 '-'로 분리 (예: 'BSPM01-1' -> ['BSPM01', '1'])
            base_prefix, criteria_num = file_prefix.split('-')
            
            # 카테고리 prefix와 section 번호 분리
            # (예: 'BSPM01' -> 카테고리:'BSPM', section:'01')
            category_prefix = ''.join(c for c in base_prefix if c.isalpha())
            section_num_raw = base_prefix[len(category_prefix):]
            
            # section 번호가 한 자리수인 경우 앞에 0 붙이기
            section_num = str(int(section_num_raw))  # 숫자로 변환했다가 다시 문자열로
            
            print(f"Extracted main prefix: {category_prefix}")
            print(f"Section number: {section_num}")
            
            # 카테고리 ID 찾기
            category_id = self._get_category_id_from_prefix(category_prefix)
            if not category_id:
                print("Category not found")
                return None, None
            
            # 카테고리 찾기
            category = next((cat for cat in self._data['category'] if cat['id'] == category_id), None)
            if not category:
                print(f"Category with ID {category_id} not found")
                return None, None
            
            # 가이드라인 찾기
            guideline = next((g for g in category['guidelines'] if g['id'] == section_num), None)
            if not guideline:
                print(f"Guideline {section_num} not found in category {category_id}")
                return None, None
            
            # criteria 찾기
            original_prefix = file_prefix  # 원래 파일명 저장 (예: BSPM01-1)
            matching_criteria = None
            for criterion in guideline['criteria']:
                testable = criterion['testable']
                if isinstance(testable, str) and 'Machine-testable' in testable:
                    test_id = testable.split('#')[-1].rstrip(')')  # URL에서 테스트 ID 추출하고 끝의 ) 제거
                    
                    if test_id == original_prefix:
                        print(f"Test ID: {test_id}")
                        matching_criteria = criterion
                        break
            
            if not matching_criteria:
                print(f"No matching criteria found for test ID {file_prefix}")
                return None, None
            
            # 가이드라인의 모든 정보를 포함하는 결과 딕셔너리 생성
            result = {
                'guideline_id': section_num,
                'guideline_title': guideline['guideline'],
                'criteria': matching_criteria['description'],
                'intent': guideline.get('intent', ''),
                'benefits': ', '.join(benefit.get('benefit', '') for benefit in guideline.get('benefits', [])),
                'example': guideline.get('example', ''),
                'tags': ', '.join(str(tag) for tag in guideline.get('tags', []))
            }
            
            print("Found matching guideline and details:")
            print(f"Guideline: {result['guideline_title']}")
            print(f"Criteria: {result['criteria'][:100]}...")
            print(f"Intent: {result['intent'][:100]}..." if result['intent'] else " ")
            print(f"Benefits: {result['benefits'][:100]}..." if result['benefits'] else " ")
            print(f"Tags: {result['tags'][:100]}..." if result['tags'] else " ")
            
            return file_prefix, result
            
        except (IndexError, ValueError) as e:
            print(f"Error parsing file name: {str(e)}")
            return None, None

    def load_all_test_files(self) -> List[str]:
        """test_suite 디렉토리의 모든 HTML 파일명을 원래 순서대로 반환"""
        test_suite_dir = Path("data/test_suite")
        if not test_suite_dir.exists():
            raise FileNotFoundError(test_suite_dir)
        return [f.name for f in test_suite_dir.glob("*.html")]  

        
class ResourceLoader:
    """웹사이트 리소스 로더"""
    
    def __init__(self):
        """초기화"""
        pass
        
    def _is_valid_url(self, url: str) -> bool:
        """URL 유효성 검사"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except:
            return False
            
    def _is_same_origin(self, url1: str, url2: str) -> bool:
        """두 URL이 같은 출처(origin)인지 확인"""
        try:
            p1 = urlparse(url1)
            p2 = urlparse(url2)
            return p1.scheme == p2.scheme and p1.netloc == p2.netloc
        except:
            return False
            
    def _collect_resource_urls(self, soup: BeautifulSoup, base_url: str) -> Dict[str, Set[str]]:
        """HTML에서 리소스 URL 수집"""
        resources = {
            'css': set(),
            'js': set(),
            'image': set()
        }
        
        # CSS 파일
        for link in soup.find_all('link', rel='stylesheet'):
            href = link.get('href')
            if href:
                resources['css'].add(urljoin(base_url, href))
                
        # JavaScript 파일
        for script in soup.find_all('script', src=True):
            src = script.get('src')
            if src:
                resources['js'].add(urljoin(base_url, src))
                
        # 이미지 파일
        for img in soup.find_all('img', src=True):
            src = img.get('src')
            if src:
                resources['image'].add(urljoin(base_url, src))
                
        return resources
        
    def _calculate_dom_stats(self, dom: BeautifulSoup, site_resource):
        """DOM 통계 계산"""
        if not dom:
            return
            
        # 전체 노드 수
        site_resource.stats.total_nodes = len(dom.find_all())
        
        # 최대 깊이 계산
        def get_depth(node, current_depth=0):
            if not hasattr(node, 'children'):
                return current_depth
            max_child_depth = current_depth
            for child in node.children:
                if isinstance(child, str):
                    continue
                child_depth = get_depth(child, current_depth + 1)
                max_child_depth = max(max_child_depth, child_depth)
            return max_child_depth
            
        site_resource.stats.max_depth = get_depth(dom)
        
        # 텍스트 노드 수
        site_resource.stats.text_nodes = len([t for t in dom.find_all(text=True) if t.strip()])
        
        # 속성 수
        attributes_count = 0
        for tag in dom.find_all():
            attributes_count += len(tag.attrs)
        site_resource.stats.attributes = attributes_count
        
        # DOM 통계를 SiteResource 속성에도 복사
        site_resource.dom_depth = site_resource.stats.max_depth
        site_resource.dom_elements = site_resource.stats.total_nodes
        site_resource.dom_text_nodes = site_resource.stats.text_nodes
        site_resource.dom_attributes = site_resource.stats.attributes
        
        # 태그 맵 생성
        for tag in dom.find_all():
            tag_name = tag.name.lower()
            if not hasattr(site_resource.stats, 'tag_counts'):
                site_resource.stats.tag_counts = {}
            site_resource.stats.tag_counts[tag_name] = site_resource.stats.tag_counts.get(tag_name, 0) + 1
            
    async def _fetch_resource(self, session: aiohttp.ClientSession, url: str, type: str) -> SiteResource:
        """단일 리소스 다운로드"""
        resource = SiteResource(url=url, content='', type=type, size=0)
        try:
            async with session.get(url) as response:
                response.raise_for_status()
                resource.headers = dict(response.headers)
                
                if type == 'html':
                    # HTML은 텍스트로 읽고 인코딩 처리
                    content = await response.read()
                    charset = response.charset or 'utf-8'
                    try:
                        resource.content = content.decode(charset)
                    except UnicodeDecodeError:
                        for encoding in ['utf-8', 'euc-kr', 'cp949']:
                            try:
                                resource.content = content.decode(encoding)
                                break
                            except UnicodeDecodeError:
                                continue
                        if not resource.content:
                            resource.content = content.decode('utf-8', errors='ignore')
                else:
                    # 다른 리소스는 바이너리로 읽음
                    resource.content = await response.read()
                    
                resource.size = len(resource.content)
                return resource
                
        except Exception as e:
            print(f"리소스 로드 실패 ({url}): {str(e)}")
            return resource
            
    async def load_website_content(self, url: str) -> SiteResource:
        """웹사이트의 모든 리소스를 로드하고 분석"""
        if not self._is_valid_url(url):
            raise ValueError(f"유효하지 않은 URL: {url}")
            
        site_resource = SiteResource(url)
        
        try:
            async with aiohttp.ClientSession() as session:
                # 1. 메인 HTML 다운로드
                main_resource = await self._fetch_resource(session, url, 'html')
                if not main_resource.content:
                    raise ValueError("HTML 컨텐츠 로드 실패")
                    
                site_resource.raw_html = main_resource.content
                site_resource.resources[url] = main_resource
                
                # 2. DOM 파싱
                site_resource.dom = BeautifulSoup(main_resource.content, 'lxml')
                
                # 3. 추가 리소스 URL 수집
                resource_urls = self._collect_resource_urls(site_resource.dom, url)
                
                # 4. 동일 출처 리소스만 다운로드
                for type, urls in resource_urls.items():
                    for res_url in urls:
                        if self._is_same_origin(url, res_url):
                            resource = await self._fetch_resource(session, res_url, type)
                            site_resource.resources[res_url] = resource
                            
                # 5. 통계 계산
                self._calculate_dom_stats(site_resource.dom, site_resource)
                
                # 6. 전체 크기 계산
                for resource in site_resource.resources.values():
                    if resource.type == 'html':
                        site_resource.stats.html_size += resource.size
                    elif resource.type == 'css':
                        site_resource.stats.css_size += resource.size
                    elif resource.type == 'js':
                        site_resource.stats.js_size += resource.size
                site_resource.stats.total_size = sum(r.size for r in site_resource.resources.values())
                
                return site_resource
                
        except aiohttp.ClientError as e:
            raise ValueError(f"웹사이트 로드 실패: {str(e)}")
