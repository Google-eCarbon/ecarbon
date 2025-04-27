from typing import Dict, List, Any, Set
from api.services.resources_loader import ResourceLoader
from api.utils.html_parser import HTMLParser
from api.models.guideline import WSGDocument
import json
from pathlib import Path
from datetime import datetime

class WSGEvaluator:
    """WSG 가이드라인 평가기"""
    
    def __init__(self):
        """초기화"""
        self.resource_loader = ResourceLoader()
        self.html_parser = HTMLParser()
        
        # WSG 가이드라인 로드
        guidelines_path = Path(__file__).parent.parent.parent / 'wsg_data' / 'wsg_guidelines.json'
        with open(guidelines_path, 'r', encoding='utf-8') as f:
            self.wsg_document = WSGDocument(**json.load(f))
    
    def _calculate_guideline_weight(self, impact: str, effort: str) -> float:
        """가이드라인 가중치 계산
        
        Args:
            impact: 영향도 (High/Medium/Low)
            effort: 노력도 (High/Medium/Low)
            
        Returns:
            float: 계산된 가중치
        """
        impact_factor = {'High': 3.0, 'Medium': 2.0, 'Low': 1.0}
        effort_factor = {'Low': 1.2, 'Medium': 1.0, 'High': 0.8}
        
        return impact_factor[impact] * effort_factor[effort]
    
    def _get_relevant_tags(self, structure_data: Dict[str, Any]) -> Set[str]:
        """HTML 구조에서 관련 태그 추출
        
        Args:
            structure_data: HTML 구조 분석 데이터
            
        Returns:
            Set[str]: 관련 태그 집합
        """
        relevant_tags = set()
        
        # 1. 기본 태그 기반
        tag_stats = structure_data['tag_stats']
        if tag_stats['total_images'] > 0:
            relevant_tags.update(['Image', 'Assets', 'Performance'])
        if tag_stats['total_scripts'] > 0:
            relevant_tags.update(['JavaScript', 'Performance'])
        if tag_stats['total_styles'] > 0:
            relevant_tags.update(['CSS', 'Performance'])
        
        # 2. 접근성 관련
        accessibility_stats = structure_data['accessibility_stats']
        if accessibility_stats['images_with_alt'] < tag_stats['total_images']:
            relevant_tags.add('Accessibility')
        if accessibility_stats['inputs_with_label'] < tag_stats['total_forms']:
            relevant_tags.update(['Accessibility', 'Form'])
        
        # 3. 성능 관련
        performance_stats = structure_data['performance_stats']
        if performance_stats['external_scripts'] > 0 or performance_stats['external_styles'] > 0:
            relevant_tags.update(['Performance', 'Environmental'])
        
        # 4. 시맨틱 태그 관련
        semantic_stats = structure_data['semantic_stats']
        if any(count > 0 for count in semantic_stats.values()):
            relevant_tags.update(['HTML', 'Accessibility'])
        
        # 5. 항상 포함되어야 하는 태그
        relevant_tags.update(['UI', 'Usability'])
        
        return relevant_tags
    
    def _filter_relevant_guidelines(self, structure_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """태그맵과 구조 데이터를 기반으로 관련 가이드라인 필터링
        
        Args:
            structure_data: HTML 구조 분석 데이터
            
        Returns:
            List[Dict]: 필터링된 가이드라인 목록
        """
        relevant_tags = self._get_relevant_tags(structure_data)
        relevant_guidelines = []
        
        # 모든 카테고리의 가이드라인을 순회
        for category in self.wsg_document.category:
            for guideline in category.guidelines:
                # 1. 태그 교집합 확인
                guideline_tags = set(guideline.tags)
                if not guideline_tags.intersection(relevant_tags):
                    continue
                
                # 2. 가중치 계산
                weight = self._calculate_guideline_weight(guideline.impact, guideline.effort)
                
                # 3. 관련 가이드라인 추가
                relevant_guidelines.append({
                    'id': f"{category.id}-{guideline.id}",
                    'guideline': guideline.guideline,
                    'impact': guideline.impact,
                    'effort': guideline.effort,
                    'weight': weight,
                    'matching_tags': list(guideline_tags.intersection(relevant_tags))
                })
        
        # 4. 가중치 기준으로 정렬
        relevant_guidelines.sort(key=lambda x: x['weight'], reverse=True)
        
        return relevant_guidelines
    
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
            # analysis = await self.gemini_client.analyze_wsg_compliance(
            #     structure_data=structure_data,
            #     url=url,
            #     guidelines=relevant_guidelines
            # )
            
            # 5. 결과 종합
            return {
                'url': url,
                'timestamp': datetime.now().isoformat(),
                'automated_checks': structure_data,
                # 'ai_analysis': analysis,
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
