from typing import List, Dict, Any
from bs4 import BeautifulSoup
import requests
from urllib.parse import urljoin, urlparse
import tiktoken
from api.core.config import settings

class ResourceLoader:
    def __init__(self):
        """리소스 로더 초기화"""
        self.tokenizer = tiktoken.get_encoding("cl100k_base")  # GPT 토크나이저 사용
        self.max_tokens_per_chunk = 512  # 청크당 최대 토큰 수
    
    def _is_valid_url(self, url: str) -> bool:
        """URL이 유효한지 확인"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except:
            return False
    
    def _extract_text_from_element(self, element) -> str:
        """HTML 요소에서 텍스트 추출"""
        return ' '.join(element.stripped_strings)
    
    def _count_tokens(self, text: str) -> int:
        """텍스트의 토큰 수 계산"""
        return len(self.tokenizer.encode(text))
    
    def _split_text_into_chunks(self, text: str) -> List[str]:
        """텍스트를 토큰 기반으로 청크로 분할"""
        tokens = self.tokenizer.encode(text)
        chunks = []
        
        for i in range(0, len(tokens), self.max_tokens_per_chunk):
            chunk_tokens = tokens[i:i + self.max_tokens_per_chunk]
            chunk_text = self.tokenizer.decode(chunk_tokens)
            if chunk_text.strip():  # 빈 청크 제외
                chunks.append(chunk_text)
        
        return chunks
    
    def _extract_semantic_chunks(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """의미 단위로 컨텐츠를 청크로 분할"""
        chunks = []
        
        # 주요 컨텐츠 영역 식별
        main_content = soup.find(['main', 'article']) or soup.find('div', {'role': 'main'})
        if not main_content:
            main_content = soup
        
        # 의미 있는 섹션 추출
        semantic_elements = main_content.find_all(['section', 'article', 'main', 'div'])
        
        for element in semantic_elements:
            # 최소 텍스트 길이 체크 (너무 작은 섹션 제외)
            text = self._extract_text_from_element(element)
            if len(text) < 100:  # 최소 100자 이상
                continue
                
            # 토큰 수 체크
            token_count = self._count_tokens(text)
            if token_count > self.max_tokens_per_chunk:
                # 토큰 수가 너무 많으면 더 작은 청크로 분할
                sub_chunks = self._split_text_into_chunks(text)
                for sub_chunk in sub_chunks:
                    chunks.append({
                        'content': sub_chunk,
                        'type': element.name,
                        'token_count': self._count_tokens(sub_chunk)
                    })
            else:
                chunks.append({
                    'content': text,
                    'type': element.name,
                    'token_count': token_count
                })
        
        return chunks
    
    def load_website_content(self, url: str) -> List[Dict[str, Any]]:
        """웹사이트 컨텐츠를 로드하고 청크로 분할"""
        if not self._is_valid_url(url):
            raise ValueError(f"유효하지 않은 URL: {url}")
        
        try:
            response = requests.get(url, headers={'User-Agent': settings.USER_AGENT})
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 불필요한 요소 제거
            for element in soup.find_all(['script', 'style', 'nav', 'footer']):
                element.decompose()
            
            # 의미 단위로 청크 추출
            chunks = self._extract_semantic_chunks(soup)
            
            if not chunks:
                # 의미 단위 추출 실패 시 전체 텍스트를 토큰 기반으로 분할
                text = self._extract_text_from_element(soup)
                text_chunks = self._split_text_into_chunks(text)
                chunks = [{'content': chunk, 'type': 'text', 'token_count': self._count_tokens(chunk)} 
                         for chunk in text_chunks]
            
            return chunks
            
        except Exception as e:
            raise Exception(f"웹사이트 컨텐츠 로드 중 오류 발생: {str(e)}")
    
    def extract_links(self, url: str) -> List[str]:
        """웹사이트에서 링크 추출"""
        if not self._is_valid_url(url):
            raise ValueError(f"유효하지 않은 URL: {url}")
        
        try:
            response = requests.get(url, headers={'User-Agent': settings.USER_AGENT})
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            base_url = response.url
            
            links = []
            for link in soup.find_all('a', href=True):
                href = link['href']
                absolute_url = urljoin(base_url, href)
                if self._is_valid_url(absolute_url):
                    links.append(absolute_url)
            
            return list(set(links))  # 중복 제거
            
        except Exception as e:
            raise Exception(f"링크 추출 중 오류 발생: {str(e)}")
