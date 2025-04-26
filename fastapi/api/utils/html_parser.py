from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin

class HTMLParser:
    """웹사이트의 HTML을 파싱하고 WSG 가이드라인 평가에 필요한 정보를 추출하는 클래스"""
    
    def __init__(self):
        self.semantic_tags = {
            'header': 'Navigation and introductory content',
            'nav': 'Navigation links',
            'main': 'Main content area',
            'article': 'Self-contained content',
            'section': 'Thematic grouping',
            'aside': 'Complementary content',
            'footer': 'Footer information'
        }
    
    def extract_page_structure(self, html: str) -> Dict[str, Any]:
        """
        HTML 문서의 구조를 분석하여 주요 구성 요소와 특성을 추출합니다.
        
        Returns:
            Dictionary containing:
            - semantic_structure: 시맨틱 태그 사용 현황
            - heading_structure: 제목 구조의 계층성
            - image_analysis: 이미지 접근성 정보
            - link_analysis: 링크 접근성 정보
            - form_analysis: 폼 접근성 정보
        """
        soup = BeautifulSoup(html, 'html.parser')
        
        return {
            'semantic_structure': self._analyze_semantic_structure(soup),
            'heading_structure': self._analyze_heading_structure(soup),
            'image_analysis': self._analyze_images(soup),
            'link_analysis': self._analyze_links(soup),
            'form_analysis': self._analyze_forms(soup)
        }
    
    def _analyze_semantic_structure(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """시맨틱 태그 사용 현황을 분석합니다."""
        structure = {tag: [] for tag in self.semantic_tags}
        
        for tag_name in self.semantic_tags:
            elements = soup.find_all(tag_name)
            for elem in elements:
                structure[tag_name].append({
                    'id': elem.get('id', ''),
                    'classes': ' '.join(elem.get('class', [])),
                    'content_length': len(elem.get_text().strip()),
                    'has_landmarks': bool(elem.find(['header', 'nav', 'main', 'article', 'footer']))
                })
        
        return structure
    
    def _analyze_heading_structure(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """제목 태그의 계층 구조를 분석합니다."""
        headings = []
        current_level = 0
        
        for tag in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            level = int(tag.name[1])
            text = tag.get_text().strip()
            
            # 제목 레벨 건너뛰기 확인
            skipped_level = level - current_level > 1 if current_level > 0 else level > 1
            
            headings.append({
                'level': level,
                'text': text,
                'skipped_level': skipped_level,
                'has_id': bool(tag.get('id')),
                'length': len(text)
            })
            
            current_level = level
        
        return {
            'headings': headings,
            'has_h1': bool(soup.find('h1')),
            'proper_hierarchy': not any(h['skipped_level'] for h in headings)
        }
    
    def _analyze_images(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """이미지 접근성을 분석합니다."""
        images = []
        
        for img in soup.find_all('img'):
            src = img.get('src', '')
            alt = img.get('alt', '')
            
            images.append({
                'src': src,
                'has_alt': bool(alt),
                'alt_text': alt,
                'alt_length': len(alt),
                'is_decorative': alt == '' and img.get('role') == 'presentation',
                'in_figure': bool(img.find_parent('figure')),
                'has_figcaption': bool(img.find_parent('figure') and img.find_parent('figure').find('figcaption'))
            })
        
        return {
            'total_images': len(images),
            'images_with_alt': sum(1 for img in images if img['has_alt']),
            'decorative_images': sum(1 for img in images if img['is_decorative']),
            'images': images
        }
    
    def _analyze_links(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """링크 접근성을 분석합니다."""
        links = []
        
        for a in soup.find_all('a'):
            href = a.get('href', '')
            text = a.get_text().strip()
            
            links.append({
                'href': href,
                'text': text,
                'has_text': bool(text),
                'text_length': len(text),
                'has_title': bool(a.get('title')),
                'has_aria_label': bool(a.get('aria-label')),
                'opens_new_window': bool(a.get('target') == '_blank'),
                'has_warning': bool(a.get('target') == '_blank' and not a.find('img', alt=re.compile(r'new window|external', re.I)))
            })
        
        return {
            'total_links': len(links),
            'links_with_text': sum(1 for link in links if link['has_text']),
            'new_window_links': sum(1 for link in links if link['opens_new_window']),
            'warning_needed': sum(1 for link in links if link['has_warning']),
            'links': links
        }
    
    def _analyze_forms(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """폼 접근성을 분석합니다."""
        forms = []
        
        for form in soup.find_all('form'):
            inputs = []
            
            for input_tag in form.find_all(['input', 'select', 'textarea']):
                input_type = input_tag.get('type', 'text') if input_tag.name == 'input' else input_tag.name
                
                if input_type not in ['hidden', 'submit', 'button']:
                    label = None
                    if id := input_tag.get('id'):
                        label = form.find('label', attrs={'for': id})
                    
                    inputs.append({
                        'type': input_type,
                        'has_label': bool(label),
                        'has_aria_label': bool(input_tag.get('aria-label')),
                        'has_placeholder': bool(input_tag.get('placeholder')),
                        'is_required': bool(input_tag.get('required')),
                        'has_error_message': bool(input_tag.get('aria-errormessage'))
                    })
            
            forms.append({
                'action': form.get('action', ''),
                'has_submit': bool(form.find(['input', 'button'], type='submit')),
                'inputs': inputs,
                'all_inputs_labeled': all(input_['has_label'] or input_['has_aria_label'] for input_ in inputs)
            })
        
        return {
            'total_forms': len(forms),
            'forms_with_submit': sum(1 for form in forms if form['has_submit']),
            'forms': forms
        }
    
    def extract_text_content(self, html: str) -> Dict[str, List[str]]:
        """
        HTML에서 의미 있는 텍스트 컨텐츠를 추출합니다.
        
        Returns:
            Dictionary containing text content categorized by semantic role
        """
        soup = BeautifulSoup(html, 'html.parser')
        
        # 불필요한 요소 제거
        for element in soup.find_all(['script', 'style']):
            element.decompose()
        
        content = {
            'main_content': [],
            'navigation': [],
            'complementary': [],
            'metadata': []
        }
        
        # 주요 컨텐츠
        if main := soup.find('main'):
            content['main_content'].extend(p.get_text().strip() for p in main.find_all('p'))
        
        # 네비게이션
        if nav := soup.find('nav'):
            content['navigation'].extend(a.get_text().strip() for a in nav.find_all('a'))
        
        # 부가 정보
        if aside := soup.find('aside'):
            content['complementary'].extend(p.get_text().strip() for p in aside.find_all('p'))
        
        # 메타데이터
        if head := soup.find('head'):
            if title := head.find('title'):
                content['metadata'].append(f"Title: {title.get_text().strip()}")
            for meta in head.find_all('meta', attrs={'name': True, 'content': True}):
                content['metadata'].append(f"{meta['name']}: {meta['content']}")
        
        return {k: [text for text in v if text] for k, v in content.items()}