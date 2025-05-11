from bs4 import BeautifulSoup
from typing import Dict, Any, List, Tuple
import re

class DOMChunker:
    """HTML 문서를 태그 N개 단위로 청크"""

    def __init__(self, html_text: str, max_tags: int = 50):
        self.html = html_text
        self.max_tags = max_tags

    def chunk(self) -> List[str]:
        soup = BeautifulSoup(self.html, "html.parser")
        current, chunks = [], []
        for tag in soup.find_all(True):
            current.append(str(tag))
            if len(current) >= self.max_tags:
                chunks.append("\n".join(current))
                current = []
        if current:
            chunks.append("\n".join(current))
        return chunks

class GuidelineChunker:
    def __init__(self, guideline_json: Dict[str, Any]):
        self.data = guideline_json

    def _create_chunk(self, text: str, chunk_type: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        청크 객체를 생성합니다.
        
        Args:
            text (str): 청크의 텍스트 내용
            chunk_type (str): 청크의 유형 (예: guideline, criterion, benefit 등)
            metadata (Dict): 청크의 메타데이터
            
        Returns:
            Dict[str, Any]: 청크 객체
        """
        return {
            "text": text,
            "type": chunk_type,
            "metadata": metadata
        }

    def chunk_by_parts(self) -> List[Dict[str, Any]]:
        """
        가이드라인을 세부 부분(main, criterion, benefit 등)으로 분리하여 청크로 만듭니다.
        
        Returns:
            List[Dict[str, Any]]: 청크 리스트. 각 청크는 텍스트, 유형, 메타데이터를 포함
        """
        chunks = []
        
        for category in self.data.get("category", []):
            category_id = category["id"]
            category_name = category["name"]
            
            if "guidelines" not in category:
                continue
                
            for guideline in category["guidelines"]:
                guideline_id = guideline["id"]
                base_metadata = {
                    "category_id": category_id,
                    "category_name": category_name,
                    "guideline_id": guideline_id,
                    "full_id": f"{category_id}-{guideline_id}",
                    "url": guideline["url"]
                }
                
                # 1. 가이드라인 제목과 의도를 하나의 청크로
                main_text = f"Guideline: {guideline['guideline']}\nIntent: {guideline.get('intent', '')}"
                chunks.append(self._create_chunk(
                    main_text,
                    "main",
                    {**base_metadata, "impact": guideline.get("impact", ""), "effort": guideline.get("effort", "")}
                ))
                
                # 2. 각 평가 기준을 개별 청크로
                for criterion in guideline.get("criteria", []):
                    criterion_text = f"Criterion: {criterion.get('title', '')}\nDescription: {criterion.get('description', '')}"
                    if 'testable' in criterion:
                        criterion_text += f"\nTestable: {criterion['testable']}"
                    
                    chunks.append(self._create_chunk(
                        criterion_text,
                        "criterion",
                        {**base_metadata, "criterion_title": criterion.get("title", "")}
                    ))
                
                # 3. 각 혜택을 개별 청크로
                for benefit_dict in guideline.get("benefits", []):
                    for category, description in benefit_dict.items():
                        benefit_text = f"Benefit - {category}:\n{description}"
                        chunks.append(self._create_chunk(
                            benefit_text,
                            "benefit",
                            {**base_metadata, "benefit_category": category}
                        ))
                
                # 4. GRI 메트릭스를 하나의 청크로
                if guideline.get("GRI"):
                    gri_parts = []
                    for gri_dict in guideline["GRI"]:
                        for metric, impact in gri_dict.items():
                            gri_parts.append(f"{metric}: {impact}")
                    gri_text = "GRI Metrics:\n" + "\n".join(gri_parts)
                    chunks.append(self._create_chunk(
                        gri_text,
                        "gri",
                        base_metadata
                    ))
                
                # 5. 예시들을 하나의 청크로
                if guideline.get("example"):
                    examples_text = "Examples:\n" + "\n".join(
                        example.get("content", "") for example in guideline["example"]
                    )
                    chunks.append(self._create_chunk(
                        examples_text,
                        "example",
                        base_metadata
                    ))
                
                # 6. 리소스들을 청크로
                if guideline.get("resources"):
                    resources_text = "Resources:\n" + "\n".join(
                        f"{title}: {url}" 
                        for resource_dict in guideline["resources"]
                        for title, url in resource_dict.items()
                    )
                    chunks.append(self._create_chunk(
                        resources_text,
                        "resource",
                        base_metadata
                    ))
        
        return chunks

    def _create_unified_guideline_text(self, guideline: Dict[str, Any]) -> str:
        """가이드라인의 모든 내용을 하나의 텍스트로 통합"""
        parts = []
        
        # 제목과 의도
        parts.append(f"Title: {guideline.get('guideline', '')}")
        parts.append(f"Intent: {guideline.get('intent', '')}\n")
        
        # 기준
        if 'criteria' in guideline:
            parts.append("Criteria:")
            for criterion in guideline['criteria']:
                parts.append(f"- {criterion.get('description', '')}")
            parts.append("")
            
        # 이점
        if 'benefits' in guideline:
            parts.append("Benefits:")
            for benefit_dict in guideline['benefits']:
                for category, description in benefit_dict.items():
                    parts.append(f"{category}:")
                    parts.append(f"- {description}")
            parts.append("")
            
        # GRI 메트릭스
        if guideline.get("GRI"):
            parts.append("GRI Metrics:")
            for gri_dict in guideline["GRI"]:
                for metric, impact in gri_dict.items():
                    parts.append(f"- {metric}: {impact}")
            parts.append("")
            
        # 예시
        if guideline.get("example"):
            parts.append("Examples:")
            for example in guideline["example"]:
                parts.append(f"- {example.get('content', '')}")
            parts.append("")
            
        # 리소스
        if guideline.get("resources"):
            parts.append("Resources:")
            for resource_dict in guideline["resources"]:
                for title, url in resource_dict.items():
                    parts.append(f"- {title}: {url}")
        
        return "\n".join(parts)

    def chunk_unified(self) -> List[Dict[str, Any]]:
        """
        각 가이드라인의 모든 내용을 하나의 청크로 통합하여 반환합니다.
        
        Returns:
            List[Dict[str, Any]]: 청크 리스트. 각 청크는 하나의 완전한 가이드라인을 포함
        """
        chunks = []
        
        for category in self.data.get("category", []):
            category_id = category["id"]
            category_name = category["name"]
            
            if "guidelines" not in category:
                continue
                
            for guideline in category["guidelines"]:
                guideline_id = guideline["id"]
                
                # 가이드라인의 모든 내용을 하나의 텍스트로 통합
                text = self._create_unified_guideline_text(guideline)
                
                # 메타데이터 설정
                metadata = {
                    "category_id": category_id,
                    "category_name": category_name,
                    "guideline_id": guideline_id,
                    "full_id": f"{category_id}-{guideline_id}",
                    "title": guideline.get("guideline", ""),
                    "url": guideline.get("url", "")
                }
                
                # 청크 생성
                chunks.append(self._create_chunk(
                    text,
                    "unified",
                    metadata
                ))
        
        return chunks

    # 기존의 chunk() 메서드는 chunk_by_parts()의 별칭으로 유지
    chunk = chunk_by_parts

if __name__ == "__main__":
    from resources_loader import InputGuidelineLoader
    
    # 테스트
    loader = InputGuidelineLoader('data/guidelines.json')
    guideline_json = loader.load_all()
    chunker = GuidelineChunker(guideline_json)
    chunks = chunker.chunk()
    
    print(f"\n=== 청크 테스트 ===")
    print(f"총 청크 수: {len(chunks)}")
    
    # 청크 타입별 개수 출력
    chunk_types = {}
    for chunk in chunks:
        chunk_type = chunk["type"]
        chunk_types[chunk_type] = chunk_types.get(chunk_type, 0) + 1
    
    print("\n청크 타입별 개수:")
    for chunk_type, count in chunk_types.items():
        print(f"- {chunk_type}: {count}개")
    
    # 샘플 청크 출력
    print("\n샘플 청크:")
    for chunk in chunks[:2]:  # 처음 2개의 청크만 출력
        print(f"\n[{chunk['type']}] {chunk['metadata']['full_id']}")
        print(f"Text: {chunk['text'][:200]}...")
