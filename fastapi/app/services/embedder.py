from langchain_openai import OpenAIEmbeddings
from typing import List

class Embedder:
    def __init__(self, **kwargs):
        self.model = OpenAIEmbeddings(
            model="text-embedding-ada-002",
            openai_api_key="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"  # 실제 API 키로 교체 필요
        )

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self.model.embed_documents(texts)

    def embed_query(self, text: str) -> List[float]:
        return self.model.embed_query(text)
