from typing import Dict, List, Optional
from pydantic import BaseModel, HttpUrl

class ResourceStats:
    """사이트 리소스 통계"""
    def __init__(self):
        # DOM 통계
        self.total_nodes: int = 0
        self.max_depth: int = 0
        self.images_count: int = 0
        self.forms_count: int = 0
        self.links_count: int = 0
        
        # 리소스 크기 (bytes)
        self.html_size: int = 0
        self.css_size: int = 0
        self.js_size: int = 0
        self.total_size: int = 0
        
        # 태그 맵 (태그별 출현 횟수)
        self.tag_map: Dict[str, int] = {}

class Resource:
    """개별 리소스 정보"""
    def __init__(self, url: str, type: str):
        self.url: str = url
        self.type: str = type  # html, css, js, image
        self.size: int = 0
        self.content: Optional[str] = None
        self.headers: Dict[str, str] = {}

class SiteResource:
    """웹사이트 전체 리소스"""
    def __init__(self, base_url: str):
        self.base_url: str = base_url
        self.resources: Dict[str, Resource] = {}  # url -> Resource
        self.stats = ResourceStats()
        self.dom = None  # BeautifulSoup object
        self.raw_html: str = ""
