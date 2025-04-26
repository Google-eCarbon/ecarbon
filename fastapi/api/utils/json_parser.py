'''
parse json data(wsg_guidelines + wsg_star)
'''
import wsg_data.wsg_guidelines as wsg_guidelines
import wsg_data.wsg_star as wsg_star
import json
from typing import Dict, Any
from datetime import datetime
from api.models.guideline import WSGDocument
from api.core.config import settings

def parse_to_json_wsg(data):
    
    return data

def parse_to_json_star(data):
    
    return data

def load_wsg_guidelines() -> WSGDocument:
    """WSG 가이드라인 JSON 파일을 로드하고 파싱합니다."""
    try:
        with open(settings.WSG_GUIDELINES_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # datetime 문자열을 datetime 객체로 변환
            data['lastModified'] = datetime.strptime(data['lastModified'], '%Y-%m-%d')
            return WSGDocument(**data)
    except Exception as e:
        raise Exception(f"WSG 가이드라인 로드 중 오류 발생: {str(e)}")

def prepare_guideline_for_embedding(guideline: Dict[str, Any]) -> str:
    """
    Vector DB 임베딩을 위해 가이드라인 데이터를 텍스트로 변환합니다.
    각 필드의 중요도에 따라 가중치를 부여합니다.
    """
    text_parts = []
    
    # 핵심 정보 (2번 반복하여 가중치 부여)
    core_info = f"{guideline['guideline']} {guideline['intent']}"
    text_parts.extend([core_info] * 2)
    
    # 평가 기준
    for criteria in guideline['criteria']:
        text_parts.append(f"{criteria['title']}: {criteria['description']}")
    
    # 이점 정보
    if 'benefits' in guideline and guideline['benefits']:
        for benefit in guideline['benefits']:
            for key, value in benefit.items():
                if value:
                    text_parts.append(f"{key} benefit: {value}")
    
    # 예시
    if 'example' in guideline and guideline['example']:
        for example in guideline['example']:
            text_parts.append(example['content'])
    
    return " ".join(text_parts)

def extract_guidelines_for_embedding(wsg_doc: WSGDocument) -> Dict[str, str]:
    """
    전체 WSG 문서에서 Vector DB에 저장할 가이드라인을 추출합니다.
    
    Returns:
        Dictionary mapping guideline IDs to their text representation
    """
    guidelines_map = {}
    
    for category in wsg_doc.category:
        for guideline in category.guidelines:
            # 카테고리 ID와 가이드라인 ID를 조합하여 고유 ID 생성
            full_id = f"{category.id}.{guideline.id}"
            text_content = prepare_guideline_for_embedding(guideline.model_dump())
            guidelines_map[full_id] = text_content
    
    return guidelines_map


if __name__ == "__main__":

    wsg_data = parse_to_json_wsg(wsg_guidelines.guidelines)
    wsg_star_data = parse_to_json_star(wsg_star.tests)
    print(wsg_data)