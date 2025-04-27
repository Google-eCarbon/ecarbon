from typing import Dict, List, Any, Optional
from api.utils.html_parser import HTMLParser
from api.services.gemini_client import GeminiClient
from api.services.resources_loader import ResourceLoader
import json
from pathlib import Path
from datetime import datetime

class WSGEvaluator:
    """WSG 가이드라인 준수 여부를 평가하는 서비스"""
    def __init__(self):
        self.html_parser = HTMLParser()
        self.gemini_client = GeminiClient()
        self.resource_loader = ResourceLoader()
        self.guidelines = self._load_guidelines()
    
    def _load_guidelines(self) -> List[Dict[str, Any]]:
        """WSG 가이드라인 데이터를 로드합니다."""
        try:
            guidelines_path = Path(__file__).parent.parent.parent / 'wsg_data' / 'wsg_guidelines.json'
            with open(guidelines_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # UX Design 카테고리의 가이드라인만 가져옴
                return data['category'][1]['guidelines']  # index 1은 'User Experience Design' 카테고리
        except Exception as e:
            raise Exception(f"WSG 가이드라인 로드 중 오류 발생: {str(e)}")
    
    def _filter_relevant_guidelines(
        self,
        structure_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        HTML 구조에 기반하여 관련된 WSG 가이드라인을 필터링합니다.
        웹사이트의 구조적 특성에 따라 관련된 가이드라인을 선택합니다.
        """
        relevant_guidelines = []
        
        # 이미지 관련 가이드라인
        if structure_data['image_analysis']['total_images'] > 0:
            relevant_guidelines.extend(g for g in self.guidelines 
                                    if any(tag.lower() in ['image', 'assets'] 
                                          for tag in g.get('tags', [])))
        
        # 폼 관련 가이드라인
        if structure_data['form_analysis']['total_forms'] > 0:
            relevant_guidelines.extend(g for g in self.guidelines 
                                    if 'form' in [tag.lower() for tag in g.get('tags', [])])
        
        # HTML 구조 관련 가이드라인
        if structure_data['semantic_structure']:
            relevant_guidelines.extend(g for g in self.guidelines 
                                    if any(tag.lower() in ['html', 'semantic'] 
                                          for tag in g.get('tags', [])))
        
        # 기본적으로 포함되어야 하는 가이드라인
        base_tags = {'performance', 'environmental', 'accessibility', 'usability', 'ui'}
        relevant_guidelines.extend(g for g in self.guidelines 
                                if any(tag.lower() in base_tags 
                                      for tag in g.get('tags', [])))
        
        # 중복 제거 (id 기준)
        seen = set()
        return [g for g in relevant_guidelines 
                if g['id'] not in seen and not seen.add(g['id'])]
    
    async def evaluate_url(self, url: str) -> Dict[str, Any]:
        """
        주어진 URL의 웹사이트를 WSG 가이드라인에 따라 평가합니다.
        
        Args:
            url: 평가할 웹사이트의 URL
            
        Returns:
            평가 결과를 포함한 딕셔너리
        """
        try:
            # 1. 웹사이트 리소스 로드
            content = await self.resource_loader.load_website_content(url)
            
            # 2. HTML 구조 분석
            structure_data = self.html_parser.extract_page_structure(content)
            
            # 3. 관련 가이드라인 필터링
            relevant_guidelines = self._filter_relevant_guidelines(structure_data)
            
            # 4. Gemini API를 통한 분석
            analysis = await self.gemini_client.analyze_wsg_compliance(
                structure_data=structure_data,
                url=url,
                guidelines=relevant_guidelines
            )
            
            # 5. 결과 종합
            return {
                'url': url,
                'timestamp': datetime.now().isoformat(),
                'automated_checks': structure_data,
                'ai_analysis': analysis,
                'relevant_guidelines': [g['id'] for g in relevant_guidelines],
                'metadata': {
                    'total_guidelines_checked': len(relevant_guidelines),
                    'automated_metrics_version': '1.0',
                    'ai_model': 'gemini-pro'
                }
            }
            
        except Exception as e:
            return {
                'url': url,
                'timestamp': datetime.now().isoformat(),
                'error': str(e),
                'status': 'failed'
            }
