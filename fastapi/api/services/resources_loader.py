import re
from typing import List, Dict, Any
from urllib.parse import urlparse
import aiohttp
from bs4 import BeautifulSoup
import tiktoken
from api.core.config import settings

class ResourceLoader:
    """웹사이트 리소스를 로드하고 분석하는 서비스"""
    
    def __init__(self):
        """초기화"""
        self.encoding = tiktoken.get_encoding("cl100k_base")
    
    def _is_valid_url(self, url: str) -> bool:
        """URL이 유효한지 확인"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except:
            return False
    
    def _count_tokens(self, text: str) -> int:
        """텍스트의 토큰 수를 계산"""
        return len(self.encoding.encode(text))
    
    def _extract_semantic_chunks(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """HTML에서 의미 단위로 청크를 추출"""
        chunks = []
        
        # 스크립트, 스타일 등 불필요한 요소 제거
        for element in soup.find_all(['script', 'style', 'meta', 'link']):
            element.decompose()
        
        # 모든 텍스트 노드를 순회하면서 처리
        for element in soup.find_all(string=True):
            if element.parent.name in ['script', 'style', 'meta', 'link']:
                continue
                
            text = element.strip()
            # if not text or len(text) < 10:  # 너무 짧은 텍스트는 제외
            #     continue
            
            token_count = self._count_tokens(text)
            parent_type = element.parent.name if element.parent else 'text'
            
            # 토큰 수가 너무 많으면 분할
            if token_count > 1000:
                sentences = re.split(r'[.!?]+', text)
                current_chunk = ""
                current_tokens = 0
                
                for sentence in sentences:
                    sentence = sentence.strip()
                    if not sentence:
                        continue
                        
                    sentence_tokens = self._count_tokens(sentence)
                    
                    if current_tokens + sentence_tokens > 1000:
                        if current_chunk:
                            chunks.append({
                                'content': current_chunk,
                                'type': parent_type,
                                'token_count': current_tokens
                            })
                        current_chunk = sentence
                        current_tokens = sentence_tokens
                    else:
                        if current_chunk:
                            current_chunk += ". "
                        current_chunk += sentence
                        current_tokens += sentence_tokens
                
                if current_chunk:
                    chunks.append({
                        'content': current_chunk,
                        'type': parent_type,
                        'token_count': current_tokens
                    })
            else:
                chunks.append({
                    'content': text,
                    'type': parent_type,
                    'token_count': token_count
                })
        
        return chunks
    
    async def load_website_content(self, url: str) -> List[Dict[str, Any]]:
        """웹사이트 컨텐츠를 로드하고 청크로 분할"""
        if not self._is_valid_url(url):
            raise ValueError(f"유효하지 않은 URL: {url}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers={'User-Agent': settings.USER_AGENT}) as response:
                    response.raise_for_status()
                    html = await response.text()
            
            soup = BeautifulSoup(html, 'html.parser')
            
            # 불필요한 요소 제거
            for element in soup.find_all(['script', 'style', 'nav', 'footer']): 
                element.decompose()
            
            # 의미 단위로 청크 추출
            return self._extract_semantic_chunks(soup)
            
        except aiohttp.ClientError as e:
            raise ValueError(f"웹사이트 로드 실패: {str(e)}")
        except Exception as e:
            raise ValueError(f"컨텐츠 처리 실패: {str(e)}")
