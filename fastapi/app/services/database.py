from typing import List, Dict, Optional
from datetime import datetime
from app.config.firebase_config import initialize_firebase
from google.cloud import firestore

class DatabaseManager:
    def __init__(self):
        """Firestore 클라이언트 초기화"""
        self.db = initialize_firebase()
        self._init_collections()

    def _init_collections(self):
        """컬렉션 초기화"""
        # Firestore는 명시적인 컬렉션 생성이 필요 없음
        # 컬렉션은 첫 번째 문서가 생성될 때 자동으로 생성됨
        pass

    def create_test_result(self, url: str, html_content: str) -> str:
        """새로운 테스트 결과를 생성하고 ID를 반환합니다."""
        doc_ref = self.db.collection('test_results').document()
        doc_ref.set({
            'test_file': url,
            'html_content': html_content,
            'created_at': datetime.now()
        })
        return doc_ref.id

    def save_evaluation_result(self, test_result_id: str, guideline_id: str, test_file_title: str, result: Dict):
        """평가 결과를 저장합니다."""
        doc_ref = self.db.collection('llm_evaluations').document()
        doc_ref.set({
            'test_result_id': test_result_id,
            'model': 'gemini-1.5-pro',
            'test_file_title': test_file_title,
            'guideline_id': guideline_id,
            'relevant_code': result.relevant_code,
            'violation': result.violation,
            'explanation': result.explanation,
            'corrected_code': result.corrected_code,
            'created_at': datetime.now()
        })
        print(f"평가 결과 저장 완료: {doc_ref.id}")

    def get_evaluation_results(self, test_result_id: str) -> Optional[Dict]:
        """특정 테스트 결과의 평가 결과를 조회합니다."""
        # 테스트 결과 기본 정보 조회
        test_doc = self.db.collection('test_results').document(test_result_id).get()
        if not test_doc.exists:
            return None

        test_data = test_doc.to_dict()

        # 평가 결과 조회
        evaluations = []
        eval_docs = self.db.collection('llm_evaluations')\
            .where('test_result_id', '==', test_result_id)\
            .stream()

        for doc in eval_docs:
            eval_data = doc.to_dict()
            evaluations.append({
                'guideline_id': eval_data['guideline_id'],
                'relevant_code': eval_data['relevant_code'],
                'violation': eval_data['violation'],
                'explanation': eval_data['explanation'],
                'corrected_code': eval_data['corrected_code']
            })

        return {
            'evaluation_id': test_result_id,
            'url': test_data['test_file'],
            'timestamp': test_data['created_at'],
            'evaluations': evaluations
        }
        
    def get_test_result_by_url(self, url: str) -> Optional[str]:
        """URL로 가장 최근의 테스트 결과 ID를 조회합니다."""
        docs = self.db.collection('test_results')\
            .where('test_file', '==', url)\
            .order_by('created_at', direction=firestore.Query.DESCENDING)\
            .limit(1)\
            .stream()
        
        for doc in docs:
            return doc.id
        return None