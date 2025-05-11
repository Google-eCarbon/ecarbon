'''
parse json data(wsg_guidelines + wsg_star)
'''
import json
from typing import Dict, Any
from datetime import datetime
from pathlib import Path
from api.models.guideline import WSGDocument
from api.core.config import settings

def parse_to_json_wsg(data):
    return data

def parse_to_json_star(data):
    return data

def load_wsg_guidelines() -> WSGDocument:
    """WSG 가이드라인 JSON 파일을 로드하고 파싱합니다."""
    try:
        guidelines_path = Path(__file__).parent.parent.parent / 'wsg_data' / 'wsg_guidelines.json'
        with open(guidelines_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return WSGDocument(**data)
    except Exception as e:
        raise Exception(f"WSG 가이드라인 로드 중 오류 발생: {str(e)}")

def prepare_guideline_for_embedding(guideline: Dict[str, Any]) -> str:
    """Vector DB 임베딩을 위해 가이드라인 데이터를 텍스트로 변환합니다."""
    text_parts = []
    
    # 1. 가이드라인 제목과 ID (높은 가중치)
    text_parts.append(f"Guideline {guideline['id']}: {guideline['guideline']} [3x]")
    
    # 2. 의도 (중간 가중치)
    text_parts.append(f"Intent: {guideline['intent']} [2x]")
    
    # 3. 평가 기준 (높은 가중치)
    for criterion in guideline.get('criteria', []):
        text_parts.append(f"Criterion: {criterion['title']} - {criterion['description']} [3x]")
    
    # 4. 예시 (낮은 가중치)
    for example in guideline.get('example', []):
        text_parts.append(f"Example: {example.get('content', '')}")
    
    # 5. 태그 (높은 가중치)
    tags = guideline.get('tags', [])
    if tags:
        text_parts.append(f"Tags: {', '.join(tags)} [3x]")
    
    return "\n".join(text_parts)

def extract_guidelines_for_embedding(wsg_doc: WSGDocument) -> Dict[str, Dict[str, Any]]:
    """전체 WSG 문서에서 Vector DB에 저장할 가이드라인을 추출합니다."""
    guidelines_map = {}
    
    for category in wsg_doc.category:
        for guideline in category.guidelines:
            guideline_id = f"{category.id}-{guideline.id}"
            guidelines_map[guideline_id] = {
                'text': prepare_guideline_for_embedding(guideline.dict()),
                'impact': guideline.impact,
                'effort': guideline.effort,
                'tags': guideline.tags,
                'criterion_id': guideline_id
            }
    
    return guidelines_map


if __name__ == "__main__":
    wsg_data = parse_to_json_wsg(json.load(open('wsg_data/wsg_guidelines.json', 'r', encoding='utf-8')))
    wsg_star_data = parse_to_json_star(json.load(open('wsg_data/wsg_star.json', 'r', encoding='utf-8')))
    print(wsg_data)