"""HTML 콘텐츠를 청크로 나누는 유틸리티 클래스"""
from bs4 import BeautifulSoup
from typing import List
import re

class HTMLChunker:
    def __init__(self, chunk_size: int = 1000):
        """HTML 청커 초기화
        
        Args:
            chunk_size (int): 각 청크의 최대 크기 (문자 수)
        """
        self.chunk_size = chunk_size
    
    def chunk_html(self, html_content: str) -> List[dict]:
        """HTML 콘텐츠를 의미 있는 청크로 나눕니다.
        
        Returns:
            List[dict]: 청크 리스트. 각 청크는 {'text': 청크 텍스트, 'chunk_type': 청크 유형} 형태의 디셔너리
        """
        if not html_content:
            return [{'text': '', 'chunk_type': 'empty'}]
            
        soup = BeautifulSoup(html_content, 'html.parser')
        chunks = []
        
        # 1. 주요 섹션별로 나누기
        for section in self._get_major_sections(soup):
            section_text = section.get_text(strip=True)
            if not section_text:
                continue
            
            section_type = section.name or 'div'
            
            # 2. 섹션이 chunk_size보다 크면 더 작은 단위로 나누기
            if len(section_text) > self.chunk_size:
                sub_chunks = self._split_into_chunks(section)
                for sub_chunk in sub_chunks:
                    chunks.append({
                        'text': sub_chunk,
                        'chunk_type': f'{section_type}_sub'
                    })
            else:
                chunks.append({
                    'text': section_text,
                    'chunk_type': section_type
                })
        
        # 청크가 없으면 전체 HTML을 하나의 청크로 처리
        if not chunks:
            full_text = soup.get_text(strip=True)
            chunks.append({
                'text': full_text[:self.chunk_size] if full_text else '',
                'chunk_type': 'full_html'
            })
        
        return chunks
    
    def _get_major_sections(self, soup: BeautifulSoup) -> List[BeautifulSoup]:
        """주요 섹션을 추출합니다."""
        sections = []
        
        # 주요 구조적 태그들
        major_tags = ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer']
        
        # 주요 섹션 태그가 있는 경우
        for tag in major_tags:
            elements = soup.find_all(tag)
            if elements:
                sections.extend(elements)
                continue
        
        # 주요 섹션 태그가 없는 경우, div로 대체
        if not sections:
            sections = soup.find_all('div', recursive=False)
            
            # div도 없는 경우, body 직계 자식들을 사용
            if not sections:
                body = soup.body
                if body:
                    sections = body.children
        
        return sections
    
    def _split_into_chunks(self, section: BeautifulSoup) -> List[str]:
        """하나의 섹션을 여러 청크로 나눕니다."""
        chunks = []
        current_chunk = ""
        
        # 단락, 리스트 항목 등을 기준으로 나누기
        for element in section.find_all(['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            text = element.get_text(strip=True)
            if not text:
                continue
                
            # 현재 청크에 추가하면 최대 크기를 초과하는 경우
            if len(current_chunk) + len(text) > self.chunk_size:
                if current_chunk:  # 현재 청크가 비어있지 않은 경우
                    chunks.append(current_chunk)
                    current_chunk = text
                else:  # 하나의 요소가 최대 크기보다 큰 경우
                    chunks.append(text[:self.chunk_size])
                    remaining = text[self.chunk_size:]
                    while remaining:
                        chunks.append(remaining[:self.chunk_size])
                        remaining = remaining[self.chunk_size:]
                    current_chunk = ""
            else:
                current_chunk += (" " if current_chunk else "") + text
        
        # 마지막 청크 추가
        if current_chunk:
            chunks.append(current_chunk)
        
        return [chunk.strip() for chunk in chunks]
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """텍스트를 문장 단위로 나눕니다."""
        # 문장 구분자: 마침표, 물음표, 느낌표 (단, 약어 등 고려)
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return sentences
