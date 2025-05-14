from pathlib import Path
import json
from typing import List, Dict, Any, Optional, Tuple
import sqlite3
from datetime import datetime

def init_database():
    """SQLite 데이터베이스 초기화"""
    conn = sqlite3.connect('evaluation.db')
    c = conn.cursor()
    
    # 위반 코드 생성 결과 테이블
    c.execute('''CREATE TABLE IF NOT EXISTS violation_generations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_file TEXT,
        guideline_id TEXT,
        guideline_title TEXT,
        guideline_criteria TEXT,
        guideline_intent TEXT,
        guideline_benefits TEXT,
        guideline_example TEXT,
        guideline_tags TEXT,
        original_html TEXT,
        violated_html TEXT,
        created_at TIMESTAMP
    )''')
    
    conn.commit()
    return conn

def save_generation_result(conn, test_file: str, guideline_info: dict, original_html: str, violated_html: str):
    """생성 결과를 데이터베이스에 저장"""
    # 모든 필드가 문자열인지 확인하고 변환
    def ensure_string(value):
        if isinstance(value, list):
            return ', '.join(str(item) for item in value)
        return str(value) if value is not None else ''

    c = conn.cursor()
    c.execute('''INSERT INTO violation_generations 
                (original_file, guideline_id, guideline_title, guideline_criteria, 
                guideline_intent, guideline_benefits, guideline_example, guideline_tags,
                original_html, violated_html, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                (test_file, 
                ensure_string(guideline_info.get('guideline_id')),
                ensure_string(guideline_info.get('guideline_title')),
                ensure_string(guideline_info.get('criteria')),
                ensure_string(guideline_info.get('intent')),
                ensure_string(guideline_info.get('benefits')),
                ensure_string(guideline_info.get('example')),
                ensure_string(guideline_info.get('tags')),
                original_html, 
                violated_html, 
                datetime.now()))
    conn.commit()

def generate_violated_html(html_content: str, guideline_text: str) -> str:
    """ChatGPT를 사용하여 가이드라인을 위반하는 HTML 생성"""
    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0.7,
        openai_api_key="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"
    )
    
    template = """You are tasked with creating HTML code that intentionally violates a web sustainability guideline.

Given:
- Original HTML:
{html_content}

- Guideline to violate:
{guideline_text}

Instructions:
1. Analyze the original HTML and the sustainability guideline
2. Create a modified version of the HTML that intentionally violates the guideline
3. Ensure the violation is clear and demonstrable
4. Keep the basic structure and purpose of the page intact
5. Only make changes necessary to violate the specific guideline

Please provide only the modified HTML code that violates the guideline. Do not include any explanations or comments."""

    prompt = ChatPromptTemplate.from_template(template)
    chain = prompt | llm
    
    result = chain.invoke({
        "html_content": html_content,
        "guideline_text": guideline_text
    })
    
    return result.content

'''
test suite html 제목으로 guideline id 찾기
'''
class InputHtmlLoader:
    """data/test_suite 폴더의 모든 HTML 파일을 읽어서 텍스트로 반환"""

    def __init__(self, folder: str):
        self.folder = Path(folder)

    def load_all(self) -> List[str]:
        if not self.folder.exists():
            raise FileNotFoundError(self.folder)
        html_list = []
        for fp in sorted(self.folder.glob("*.html")):
            html_list.append(fp.read_text(encoding="utf-8"))
        return html_list

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
