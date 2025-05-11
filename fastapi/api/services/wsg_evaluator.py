from typing import Dict, Any, List
from config.firebase_config import initialize_firebase
from datetime import datetime
from vector_db import VectorDBService
from gemini_client import GeminiClient
from resources_loader import ResourceLoader
from html_parser import HTMLParser
from html_chunker import HTMLChunker
from dataclasses import dataclass
@dataclass
class EvaluationResult:
    guideline_id: str
    score: float
    violations: List[Dict[str, str]]
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

class WSGEvaluator:
    def __init__(self):
        """WSG 평가기를 초기화합니다."""
        self.vector_db = VectorDBService()
        self.vector_db.load_guidelines()
        self.gemini_client = GeminiClient()
        self.resource_loader = ResourceLoader()
        self.html_parser = HTMLParser()
        self.html_chunker = HTMLChunker()
        self.db = initialize_firebase()
        
    def evaluate_code(self, code: str, guideline: str, model_name='gemini-1.5-flash') -> EvaluationResult:
        """코드와 가이드라인을 평가"""
        try:
            # GeminiClient 인스턴스의 evaluate_code 메서드 호출
            response = self.gemini_client.evaluate_code(code, guideline, model_name)
            
            # 응답 처리
            violations = []
            if hasattr(response, 'violation') and response.violation == 'Yes':
                violations.append({
                    'location': response.relevant_code,
                    'description': response.explanation,
                    'suggestion': response.corrected_code
                })
                
            # 평가 결과 생성
            return EvaluationResult(
                guideline_id="test",  # 실제 구현에서는 적절한 ID 사용
                score=0.0 if violations else 1.0,
                violations=violations
            )
        
        except Exception as e:
            print(f"Error evaluating code: {str(e)}")
            # 오류 발생 시 빈 결과 반환
            return EvaluationResult(
                guideline_id="error",
                score=0.0,
                violations=[{
                    'location': 'unknown',
                    'description': f"Error: {str(e)}",
                    'suggestion': 'Check the code and try again'
                }]
            )

    async def evaluate_website(self, url: str) -> Dict[str, Any]:
        """웹사이트를 WSG 가이드라인에 따라 평가합니다."""
        try:
            # 1. 웹사이트 리소스 로드
            site_resource = await self.resource_loader.load_website_content(url)
            
            # 2. HTML 구조 분석
            structure_data = self.html_parser.extract_page_structure(site_resource.raw_html)
            
            # 3. HTML 청킹
            chunks = self.html_chunker.chunk_html(site_resource.raw_html)
            
            # 4. 벡터 DB에 웹사이트 콘텐츠 저장
            self.vector_db.add_website_content(url, site_resource.raw_html, chunks)
            
            # 5. 관련 가이드라인 필터링
            relevant_guidelines = self.vector_db.find_relevant_guidelines(
                url=url,
                tag_map=site_resource.stats.tag_map,
                top_k=10
            )
            
            # 6. 가이드라인 평가
            evaluations = []
            total_score = 0
            max_score = 0
            
            for guideline in relevant_guidelines:
                # 각 가이드라인에 대한 평가 수행
                violations = await self.gemini_client.evaluate_guideline(
                    guideline_id=guideline['guideline_id'],
                    html_content=site_resource.raw_html,
                    chunks=chunks
                )
                
                # 위반 사항이 없으면 만점
                score = 1.0 if not violations else 0.5 / len(violations)
                weighted_score = score * guideline['weight']
                
                total_score += weighted_score
                max_score += guideline['weight']
                
                evaluations.append({
                    'guideline_id': guideline['guideline_id'],
                    'impact': guideline['impact'],
                    'effort': guideline['effort'],
                    'violations': violations,
                    'score': score,
                    'weighted_score': weighted_score
                })
            
            # 7. 최종 점수 계산
            compliance_score = (total_score / max_score * 100) if max_score > 0 else 0
            
            # 8. 리소스 통계 변환
            resource_stats = {
                'total_size_kb': site_resource.stats.total_size // 1024,
                'html_size_kb': site_resource.stats.html_size // 1024,
                'css_size_kb': site_resource.stats.css_size // 1024,
                'js_size_kb': site_resource.stats.js_size // 1024,
                'image_size_kb': site_resource.stats.images_size // 1024,
                'total_requests': len(site_resource.resources)
            }
            
            # 9. 구조 통계 변환
            structure_stats = {
                'total_nodes': site_resource.stats.total_nodes,
                'max_depth': site_resource.stats.max_depth,
                'tag_distribution': site_resource.stats.tag_map,
                'accessibility': {
                    'images_with_alt': structure_data.get('images_with_alt', 0),
                    'form_labels': structure_data.get('form_labels', 0),
                    'aria_attributes': structure_data.get('aria_attributes', 0)
                },
                'performance': {
                    'external_resources': structure_data.get('external_resources', 0),
                    'inline_styles': structure_data.get('inline_styles', 0),
                    'inline_scripts': structure_data.get('inline_scripts', 0)
                }
            }
            
            # 결과를 Firestore에 저장
            result = {
                'url': url,
                'compliance_score': compliance_score,
                'resource_stats': resource_stats,
                'structure_stats': structure_stats,
                'evaluations': evaluations,
                'created_at': datetime.now()
            }
            
            # Firestore에 저장
            doc_ref = self.db.collection('website_evaluations').document()
            doc_ref.set(result)
            
            # document ID를 결과에 추가
            result['evaluation_id'] = doc_ref.id
            return result
            
        except Exception as e:
            raise Exception(f"웹사이트 평가 중 오류 발생: {str(e)}")

    def _filter_relevant_guidelines(self, structure_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """구조 데이터를 기반으로 관련 가이드라인을 필터링합니다."""
        try:
            # 태그맵 추출
            tag_map = structure_data.get('tag_distribution', {})
            
            # 가이드라인 검색
            return self.vector_db.find_relevant_guidelines(
                url="",  # 실제 URL은 필요하지 않음
                tag_map=tag_map,
                top_k=10
            )
            
        except Exception as e:
            raise Exception(f"가이드라인 필터링 중 오류 발생: {str(e)}")
