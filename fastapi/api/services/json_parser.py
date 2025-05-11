"""JSON 파일 파싱을 위한 유틸리티 함수들"""
import json
from pathlib import Path
from typing import Dict, Any, List

def load_wsg_guidelines(file_path: str = None) -> Dict[str, Any]:
    """WSG 가이드라인 JSON 파일을 로드합니다."""
    try:
        # 파일 경로가 없으면 기본 경로 사용
        if file_path is None:
            # 현재 파일의 경로를 기준으로 상대 경로 계산
            current_dir = Path(__file__).parent
            possible_paths = [
                current_dir / "../../data/wsg_guidelines.json",  # 프로젝트 루트 기준 data 디렉토리
                current_dir / "../data/wsg_guidelines.json",    # api 디렉토리 기준
                current_dir / "../wsg_data/wsg_guidelines.json"  # 다른 가능한 경로
            ]
            
            # 가능한 경로 중 존재하는 경로 사용
            for path in possible_paths:
                if path.exists():
                    file_path = str(path.resolve())
                    print(f"Using guidelines file: {file_path}")
                    break
            else:
                # 기본 경로 사용
                file_path = str((current_dir / "../../data/wsg_guidelines.json").resolve())
                print(f"Using default path: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        print(f"Error: File not found - {file_path}")
        return {}
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in file - {file_path}")
        return {}
    except Exception as e:
        print(f"Error loading guidelines: {str(e)}")
        return {}

def extract_guidelines_for_embedding(guidelines: Dict[str, Any]) -> List[Dict[str, Any]]:
    """임베딩을 위한 가이드라인 데이터를 추출합니다."""
    extracted_guidelines = []
    
    # 데이터 구조 검증
    if not isinstance(guidelines, dict):
        print(f"가이드라인 데이터가 예상 형식이 아닙니다. 타입: {type(guidelines)}")
        return []
        
    # 카테고리 목록 확인
    categories = guidelines.get('category', [])
    if not categories:
        print("카테고리 정보를 찾을 수 없습니다.")
        return []
        
    print(f"카테고리 수: {len(categories)}")
    
    for category in categories:
        category_id = category.get('id', '')
        category_name = category.get('name', '')
        
        # 가이드라인 목록 확인
        guidelines_list = category.get('guidelines', [])
        if not guidelines_list:
            print(f"카테고리 '{category_name}'에 가이드라인이 없습니다.")
            continue
            
        print(f"카테고리 '{category_name}'의 가이드라인 수: {len(guidelines_list)}")
        
        for guideline in guidelines_list:
            guideline_id = guideline.get('id', '')
            # 가이드라인 필드 이름 확인 - 'name' 대신 'guideline' 필드 사용
            guideline_text = guideline.get('guideline', '')
            guideline_url = guideline.get('url', '')
            criteria = guideline.get('criteria', [])
            
            # 기준(criteria)에서 설명 추출
            criteria_text = '\n'.join([c.get('criterion', '') for c in criteria]) if criteria else ''
            
            # 가이드라인 전체 ID 생성 (카테고리ID.가이드라인ID)
            full_id = f"{category_id}.{guideline_id}"
            
            # 임베딩용 텍스트 생성
            text_for_embedding = f"{category_name} - {guideline_text}\n{criteria_text}"
            
            extracted_guidelines.append({
                'full_id': full_id,
                'category_id': category_id,
                'category_name': category_name,
                'guideline_id': guideline_id,
                'title': guideline_text,
                'url': guideline_url,
                'criteria': criteria_text,
                'text': text_for_embedding
            })
    
    print(f"추출된 가이드라인 수: {len(extracted_guidelines)}")
    return extracted_guidelines
