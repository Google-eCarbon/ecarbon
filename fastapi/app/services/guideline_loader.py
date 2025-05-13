import json
from typing import List
from langchain_community.vectorstores import Chroma
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

class InputGuidelineLoader:
    """data/guidelines.json 파일을 읽어서 JSON 객체로 반환"""

    def __init__(self, file_path: str):
        print(f"\n=== Guideline Loader Initialization ===")
        print(f"File path: {file_path}")
        self.file_path = Path(file_path)
        self._data = None

    def load_all(self) -> Dict[str, Any]:
        print("\n=== Loading Guideline Data ===")
        if not self.file_path.exists():
            print(f"Error: File not found - {self.file_path}")
            raise FileNotFoundError(self.file_path)
        if self._data is None:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                self._data = json.load(f)
                print("Guideline data loaded successfully")
                print(f"Number of categories: {len(self._data.get('category', []))}")
        return self._data

    def _get_category_id_from_prefix(self, file_prefix: str) -> Optional[str]:
        """파일 prefix로부터 카테고리 ID 결정"""
        # 카테고리 ID 매핑
        prefix_map = {
            'BSPM': '5',  # Business Strategy And Product Management
            'UX': '2',    # User Experience
            'WD': '3',    # Web Design
            'HIS': '4'    # Hosting Infrastructure Services
        }
        
        # 파일 prefix 추출 (예: BSPM01-1 -> BSPM)
        main_prefix = ''.join(c for c in file_prefix if c.isalpha())
        print(f"Extracted main prefix: {main_prefix}")
        
        category_id = prefix_map.get(main_prefix)
        if category_id:
            print(f"Mapped to category ID: {category_id}")
        else:
            print(f"Warning: No category mapping for {main_prefix}")
        
        return category_id

    def get_guideline_for_test_file(self, test_file: str) -> Tuple[Optional[str], Optional[Dict]]:
        """테스트 파일명으로부터 해당하는 가이드라인과 criteria, intent, benefits, example, tags 반환"""
        print(f"\n=== Finding guideline for test file: {test_file} ===")
        
        # 파일 prefix 추출 (예: BSPM01-1.html -> BSPM01-1)
        file_prefix = test_file.split('.')[0]
        print(f"File prefix: {file_prefix}")
        
        try:
            # 파일명을 '-'로 분리 (예: 'BSPM01-1' -> ['BSPM01', '1'])
            base_prefix, criteria_num = file_prefix.split('-')
            
            # 카테고리 prefix와 section 번호 분리
            # (예: 'BSPM01' -> 카테고리:'BSPM', section:'01')
            category_prefix = ''.join(c for c in base_prefix if c.isalpha())
            section_num_raw = base_prefix[len(category_prefix):]
            
            # section 번호가 한 자리수인 경우 앞에 0 붙이기
            section_num = str(int(section_num_raw))  # 숫자로 변환했다가 다시 문자열로
            
            print(f"Extracted main prefix: {category_prefix}")
            print(f"Section number: {section_num}")
            
            # 카테고리 ID 찾기
            category_id = self._get_category_id_from_prefix(category_prefix)
            if not category_id:
                print("Category not found")
                return None, None
            
            # 카테고리 찾기
            category = next((cat for cat in self._data['category'] if cat['id'] == category_id), None)
            if not category:
                print(f"Category with ID {category_id} not found")
                return None, None
            
            # 가이드라인 찾기
            guideline = next((g for g in category['guidelines'] if g['id'] == section_num), None)
            if not guideline:
                print(f"Guideline {section_num} not found in category {category_id}")
                return None, None
            
            # criteria 찾기
            original_prefix = file_prefix  # 원래 파일명 저장 (예: BSPM01-1)
            matching_criteria = None
            for criterion in guideline['criteria']:
                testable = criterion['testable']
                if isinstance(testable, str) and 'Machine-testable' in testable:
                    test_id = testable.split('#')[-1].rstrip(')')  # URL에서 테스트 ID 추출하고 끝의 ) 제거
                    
                    if test_id == original_prefix:
                        print(f"Test ID: {test_id}")
                        matching_criteria = criterion
                        break
            
            if not matching_criteria:
                print(f"No matching criteria found for test ID {file_prefix}")
                return None, None
            
            # 가이드라인의 모든 정보를 포함하는 결과 딕셔너리 생성
            result = {
                'guideline_id': section_num,
                'guideline_title': guideline['guideline'],
                'criteria': matching_criteria['description'],
                'intent': guideline.get('intent', ''),
                'benefits': ', '.join(benefit.get('benefit', '') for benefit in guideline.get('benefits', [])),
                'example': guideline.get('example', ''),
                'tags': ', '.join(str(tag) for tag in guideline.get('tags', []))
            }
            
            print("Found matching guideline and details:")
            print(f"Guideline: {result['guideline_title']}")
            print(f"Criteria: {result['criteria'][:100]}...")
            print(f"Intent: {result['intent'][:100]}..." if result['intent'] else " ")
            print(f"Benefits: {result['benefits'][:100]}..." if result['benefits'] else " ")
            print(f"Tags: {result['tags'][:100]}..." if result['tags'] else " ")
            
            return file_prefix, result
            
        except (IndexError, ValueError) as e:
            print(f"Error parsing file name: {str(e)}")
            return None, None

    def load_all_test_files(self) -> List[str]:
        """test_suite 디렉토리의 모든 HTML 파일명을 원래 순서대로 반환"""
        test_suite_dir = Path("data/test_suite")
        if not test_suite_dir.exists():
            raise FileNotFoundError(test_suite_dir)
        return [f.name for f in test_suite_dir.glob("*.html")]  

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

