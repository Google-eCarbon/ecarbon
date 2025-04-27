import re
from typing import Dict, List, Any, Set
from urllib.parse import urljoin, urlparse
import aiohttp
from bs4 import BeautifulSoup
import lxml.html
from api.core.config import settings
from api.models.site_resource import SiteResource, Resource

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
        
    def _calculate_dom_stats(self, dom: BeautifulSoup, site_resource: SiteResource):
        """DOM 통계 계산"""
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
                depth = get_depth(child, current_depth + 1)
                max_child_depth = max(max_child_depth, depth)
            return max_child_depth
            
        site_resource.stats.max_depth = get_depth(dom)
        
        # 주요 요소 수 계산
        site_resource.stats.images_count = len(dom.find_all('img'))
        site_resource.stats.forms_count = len(dom.find_all('form'))
        site_resource.stats.links_count = len(dom.find_all('a'))
        
        # 태그 맵 생성
        for tag in dom.find_all():
            tag_name = tag.name.lower()
            site_resource.stats.tag_map[tag_name] = site_resource.stats.tag_map.get(tag_name, 0) + 1
            
    async def _fetch_resource(self, session: aiohttp.ClientSession, url: str, type: str) -> Resource:
        """단일 리소스 다운로드"""
        resource = Resource(url, type)
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
