from typing import List, Dict, Any
from bs4 import BeautifulSoup, Tag
import re

class HTMLChunker:
    """HTML 문서를 청킹하는 유틸리티 클래스"""
    
    def __init__(self, max_tokens: int = 256, overlap_ratio: float = 0.15):
        """초기화
        
        Args:
            max_tokens: 청크당 최대 토큰 수 (기본값: 256)
            overlap_ratio: 청크 간 중첩 비율 (기본값: 0.15)
        """
        self.max_tokens = max_tokens
        self.overlap_ratio = overlap_ratio
    
    def _estimate_tokens(self, text: str) -> int:
        """텍스트의 토큰 수를 대략적으로 추정
        
        Args:
            text: 추정할 텍스트
            
        Returns:
            int: 추정된 토큰 수
        """
        # 간단한 휴리스틱: 공백으로 구분된 단어 수 * 1.3
        return int(len(text.split()) * 1.3)
    
    def _clean_text(self, text: str) -> str:
        """텍스트 전처리
        
        Args:
            text: 전처리할 텍스트
            
        Returns:
            str: 전처리된 텍스트
        """
        # 1. 주석 제거
        text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
        
        # 2. 연속된 공백 제거
        text = re.sub(r'\s+', ' ', text)
        
        # 3. 긴 텍스트 대체
        def replace_long_text(match):
            text = match.group(1)
            if len(text) > 80:
                return '<p>TEXT_PLACEHOLDER</p>'
            return match.group(0)
        
        text = re.sub(r'<p[^>]*>(.*?)</p>', replace_long_text, text, flags=re.DOTALL)
        
        return text.strip()
    
    def _process_external_resources(self, soup: BeautifulSoup) -> None:
        """외부 리소스(JS, CSS) 처리
        
        Args:
            soup: BeautifulSoup 객체
        """
        # 1. 외부 스크립트
        for script in soup.find_all('script', src=True):
            size = len(script.string) if script.string else 0
            script.string = f'{{JS_FILE: {size//1024}KB}}'
        
        # 2. 외부 스타일시트
        for link in soup.find_all('link', rel='stylesheet'):
            link['href'] = f'{{CSS_FILE: {link["href"]}}}'
    
    def _get_semantic_blocks(self, soup: BeautifulSoup) -> List[Tag]:
        """의미 있는 HTML 블록 추출
        
        Args:
            soup: BeautifulSoup 객체
            
        Returns:
            List[Tag]: 의미 있는 블록 태그 목록
        """
        # 1. 시맨틱 태그
        semantic_tags = ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer']
        blocks = []
        
        for tag in semantic_tags:
            blocks.extend(soup.find_all(tag))
        
        # 2. 주요 div (depth 1)
        if not blocks:
            blocks.extend(soup.find_all('div', recursive=False))
        
        # 3. 대체 블록
        if not blocks:
            blocks = [soup.body] if soup.body else [soup]
        
        return blocks
    
    def chunk_html(self, html: str) -> List[Dict[str, Any]]:
        """HTML 문서를 청크로 분할
        
        Args:
            html: HTML 문서 문자열
            
        Returns:
            List[Dict]: 청크 목록 (각 청크는 text와 metadata를 포함)
        """
        # 1. HTML 파싱 및 전처리
        html = self._clean_text(html)
        soup = BeautifulSoup(html, 'lxml')
        self._process_external_resources(soup)
        
        # 2. 의미 있는 블록 추출
        blocks = self._get_semantic_blocks(soup)
        chunks = []
        
        # 3. 각 블록을 청크로 변환
        for block in blocks:
            block_text = str(block)
            tokens = self._estimate_tokens(block_text)
            
            if tokens <= self.max_tokens:
                chunks.append({
                    'text': block_text,
                    'tag': block.name,
                    'tokens': tokens,
                    'attributes': dict(block.attrs)
                })
            else:
                # 큰 블록은 하위 요소로 분할
                for child in block.children:
                    if isinstance(child, Tag):
                        child_text = str(child)
                        child_tokens = self._estimate_tokens(child_text)
                        
                        if child_tokens <= self.max_tokens:
                            chunks.append({
                                'text': child_text,
                                'tag': child.name,
                                'tokens': child_tokens,
                                'attributes': dict(child.attrs)
                            })
        
        return chunks
