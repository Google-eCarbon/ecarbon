from firebase_admin import firestore
from app.db.firebase import initialize_firebase

def get_firestore_db():
    """
    Firestore 데이터베이스 인스턴스를 반환하는 의존성 함수
    """
    db = initialize_firebase()
    return db
