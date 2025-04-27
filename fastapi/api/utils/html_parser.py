from typing import Dict, Any
from bs4 import BeautifulSoup
import lxml.html

class HTMLParser:
    """HTML 문서 파서"""
    
    def extract_page_structure(self, html_content: str) -> Dict[str, Any]:
        """HTML 문서의 구조를 분석하여 반환
        
        Args:
            html_content: HTML 문서 내용
            
        Returns:
            Dict[str, Any]: HTML 구조 분석 결과
        """
        soup = BeautifulSoup(html_content, 'lxml')
        
        # 1. 기본 태그 통계
        tag_stats = {
            'total_tags': len(soup.find_all()),
            'total_images': len(soup.find_all('img')),
            'total_links': len(soup.find_all('a')),
            'total_forms': len(soup.find_all('form')),
            'total_scripts': len(soup.find_all('script')),
            'total_styles': len(soup.find_all('style')),
            'total_iframes': len(soup.find_all('iframe'))
        }
        
        # 2. 시맨틱 태그 분석
        semantic_tags = ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer']
        semantic_stats = {tag: len(soup.find_all(tag)) for tag in semantic_tags}
        
        # 3. 접근성 속성 분석
        accessibility_stats = {
            'images_with_alt': len([img for img in soup.find_all('img') if img.get('alt')]),
            'inputs_with_label': len([inp for inp in soup.find_all('input') if inp.get('aria-label') or inp.get('id')]),
            'links_with_text': len([a for a in soup.find_all('a') if a.get_text().strip()])
        }
        
        # 4. 성능 관련 분석
        performance_stats = {
            'external_scripts': len([s for s in soup.find_all('script') if s.get('src')]),
            'external_styles': len([s for s in soup.find_all('link', rel='stylesheet')]),
            'inline_styles': len([s for s in soup.find_all('style')]),
            'images_with_lazy': len([img for img in soup.find_all('img') if img.get('loading') == 'lazy'])
        }
        
        return {
            'tag_stats': tag_stats,
            'semantic_stats': semantic_stats,
            'accessibility_stats': accessibility_stats,
            'performance_stats': performance_stats
        }