"""LangChain retriever module — document retrieval with metadata filtering."""

from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from pydantic import Field
from qdrant_client.models import FieldCondition, Filter, MatchAny, MatchValue

from app.ai.vectorstore import get_vector_store
from app.core.config import settings


class PDFSageRetriever(BaseRetriever):
    """Custom retriever that filters by user_id and optional doc_ids."""

    user_id: str = Field(description="User ID for filtering")
    doc_ids: list[str] | None = Field(default=None, description="Document IDs to filter by")
    k: int = Field(default=10, description="Number of results to return")

    class Config:
        arbitrary_types_allowed = True

    def _get_relevant_documents(self, query: str) -> list[Document]:
        vector_store = get_vector_store()

        # Build filter conditions
        must_conditions = [
            FieldCondition(key="user_id", match=MatchValue(value=self.user_id))
        ]

        if self.doc_ids:
            if len(self.doc_ids) == 1:
                must_conditions.append(
                    FieldCondition(key="doc_id", match=MatchValue(value=self.doc_ids[0]))
                )
            else:
                must_conditions.append(
                    FieldCondition(key="doc_id", match=MatchAny(any=self.doc_ids))
                )

        # Use Qdrant's native similarity search with filter
        from app.ai.embeddings import get_embeddings
        embeddings = get_embeddings()
        query_vector = embeddings.embed_query(query)

        client = vector_store.client
        results = client.query_points(
            collection_name=settings.qdrant_collection,
            query=query_vector,
            query_filter=Filter(must=must_conditions),
            limit=self.k,
            with_payload=True,
        )

        documents = []
        for point in results.points:
            payload = point.payload or {}
            metadata = {
                "doc_id": payload.get("doc_id", ""),
                "page_number": payload.get("page_number", 0),
                "chunk_index": payload.get("chunk_index", 0),
                "content_type": payload.get("content_type", "text"),
                "score": point.score,
            }
            doc = Document(
                page_content=payload.get("content", ""),
                metadata=metadata,
            )
            documents.append(doc)

        return documents


def get_retriever(user_id: str, doc_ids: list[str] | None = None, k: int = 10) -> PDFSageRetriever:
    """Get configured retriever."""
    return PDFSageRetriever(user_id=user_id, doc_ids=doc_ids, k=k)
