"""LangChain embeddings module — configurable embedding providers."""

from langchain_core.embeddings import Embeddings
from langchain_openai import OpenAIEmbeddings

from app.core.config import settings


def get_embeddings() -> Embeddings:
    """Get configured embedding model.

    Uses OpenRouter as OpenAI-compatible endpoint.
    Supports: openai/text-embedding-3-small, BGE, Jina, etc.
    """
    return OpenAIEmbeddings(
        model=settings.embedding_model,
        openai_api_key=settings.openrouter_api_key,
        openai_api_base=f"{settings.openrouter_base_url}",
        dimensions=settings.embedding_dim,
    )
