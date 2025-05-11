"""HTML 파싱을 위한 유틸리티 클래스"""
from bs4 import BeautifulSoup
from typing import Dict, Any

class HTMLParser:
    def __init__(self):
        """HTML 파서 초기화"""
        pass
    
    def extract_page_structure(self, html_content: str) -> Dict[str, Any]:
        """HTML 페이지의 구조를 분석하여 반환합니다."""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        structure = {
            'title': self._get_title(soup),
            'meta': self._get_meta_info(soup),
            'headings': self._get_headings(soup),
            'links': self._get_links(soup),
            'images': self._get_images(soup),
            'forms': self._get_forms(soup),
            'tables': self._get_tables(soup)
        }
        
        return structure
    
    def _get_title(self, soup: BeautifulSoup) -> str:
        """페이지 제목을 추출합니다."""
        title_tag = soup.title
        return title_tag.string.strip() if title_tag else ""
    
    def _get_meta_info(self, soup: BeautifulSoup) -> Dict[str, str]:
        """메타 정보를 추출합니다."""
        meta_info = {}
        for meta in soup.find_all('meta'):
            name = meta.get('name', meta.get('property', ''))
            content = meta.get('content', '')
            if name and content:
                meta_info[name] = content
        return meta_info
    
    def _get_headings(self, soup: BeautifulSoup) -> Dict[str, int]:
        """헤딩 태그 사용 현황을 분석합니다."""
        headings = {}
        for i in range(1, 7):
            count = len(soup.find_all(f'h{i}'))
            if count > 0:
                headings[f'h{i}'] = count
        return headings
    
    def _get_links(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """링크 정보를 분석합니다."""
        links = {
            'total': 0,
            'internal': 0,
            'external': 0,
            'broken': 0  # 실제 검사는 별도로 수행
        }
        
        for link in soup.find_all('a', href=True):
            href = link['href']
            links['total'] += 1
            if href.startswith(('http://', 'https://')):
                links['external'] += 1
            else:
                links['internal'] += 1
        
        return links
    
    def _get_images(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """이미지 사용 현황을 분석합니다."""
        images = {
            'total': 0,
            'with_alt': 0,
            'without_alt': 0
        }
        
        for img in soup.find_all('img'):
            images['total'] += 1
            if img.get('alt'):
                images['with_alt'] += 1
            else:
                images['without_alt'] += 1
        
        return images
    
    def _get_forms(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """폼 요소 사용 현황을 분석합니다."""
        forms = {
            'total': len(soup.find_all('form')),
            'inputs': len(soup.find_all('input')),
            'selects': len(soup.find_all('select')),
            'textareas': len(soup.find_all('textarea'))
        }
        return forms
    
    def _get_tables(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """테이블 사용 현황을 분석합니다."""
        tables = {
            'total': len(soup.find_all('table')),
            'with_caption': len(soup.find_all('table', lambda tag: tag.find('caption'))),
            'with_headers': len(soup.find_all('table', lambda tag: tag.find('th')))
        }
        return tables
