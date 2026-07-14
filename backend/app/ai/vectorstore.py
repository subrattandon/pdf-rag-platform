"""LangChain Qdrant vector store module."""

import logging

from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PayloadSchemaType, VectorParams

from app.ai.embeddings import get_embeddings
from app.core.config import settings

logger = logging.getLogger(__name__)


def get_qdrant_client() -> QdrantClient:
    """Get Qdrant client instance."""
    return QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)


def get_vector_store() -> QdrantVectorStore:
    """Get LangChain Qdrant vector store."""
    embeddings = get_embeddings()
    return QdrantVectorStore(
        client=get_qdrant_client(),
        collection_name=settings.qdrant_collection,
        embedding=embeddings,
    )


def ensure_collection() -> None:
    """Create Qdrant collection if it doesn't exist."""
    client = get_qdrant_client()
    collections = client.get_collections().collections
    names = [c.name for c in collections]

    if settings.qdrant_collection not in names:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(
                size=settings.embedding_dim,
                distance=Distance.COSINE,
            ),
        )

    # Create payload indexes for filtering
    for field in ["user_id", "doc_id"]:
        try:
            client.create_payload_index(
                collection_name=settings.qdrant_collection,
                field_name=field,
                field_schema=PayloadSchemaType.KEYWORD,
            )
        except Exception as e:
            logger.warning("Failed to create payload index for %s: %s", field, e)
