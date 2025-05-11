import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path

def initialize_firebase():
    """Firebase 초기화"""
    cred_path = Path(__file__).parent / "serviceAccountKey.json"
    if not firebase_admin._apps:
        cred = credentials.Certificate(str(cred_path))
        firebase_admin.initialize_app(cred)
    return firestore.client()
