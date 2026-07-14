import logging
import time
import uuid

import fitz  # PyMuPDF
import httpx
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document

logger = logging.getLogger(__name__)

CHUNK_SIZE = 512
CHUNK_OVERLAP = 50
EMBEDDING_BATCH_SIZE = 64

# Module-level singletons — reused across requests
_qdrant_client: QdrantClient | None = None
_collection_ready = False
_http_client: httpx.Client | None = None


def _get_qdrant_client() -> QdrantClient:
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)
    return _qdrant_client


def _get_http_client() -> httpx.Client:
    global _http_client
    if _http_client is None:
        _http_client = httpx.Client(timeout=httpx.Timeout(60.0, connect=10.0))
    return _http_client


def chunk_text(text: str) -> list[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + CHUNK_SIZE, len(words))
        chunks.append(" ".join(words[start:end]))
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def extract_page_text(page) -> str:
    return page.get_text("text") or ""


def get_embeddings(texts: list[str]) -> list[list[float]]:
    client = _get_http_client()
    resp = client.post(
        f"{settings.openrouter_base_url}/embeddings",
        headers={
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
        },
        json={"model": settings.embedding_model, "input": texts},
    )
    resp.raise_for_status()
    data = resp.json()["data"]
    return [item["embedding"] for item in sorted(data, key=lambda x: x["index"])]


def get_embeddings_batched(texts: list[str]) -> list[list[float]]:
    if len(texts) <= EMBEDDING_BATCH_SIZE:
        return get_embeddings(texts)

    all_embeddings = []
    for i in range(0, len(texts), EMBEDDING_BATCH_SIZE):
        batch = texts[i : i + EMBEDDING_BATCH_SIZE]
        all_embeddings.extend(get_embeddings(batch))
    return all_embeddings


def ensure_qdrant_collection(client: QdrantClient):
    global _collection_ready
    if _collection_ready:
        return

    from qdrant_client.models import PayloadSchemaType

    collections = client.get_collections().collections
    names = [c.name for c in collections]
    if settings.qdrant_collection not in names:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(size=settings.embedding_dim, distance=Distance.COSINE),
        )

    for field in ["user_id", "doc_id"]:
        try:
            client.create_payload_index(
                collection_name=settings.qdrant_collection,
                field_name=field,
                field_schema=PayloadSchemaType.KEYWORD,
            )
        except Exception as e:
            logger.warning("Failed to create payload index for %s: %s", field, e)

    _collection_ready = True


def process_document_embeddings(
    doc: Document, pdf: fitz.Document, db: Session
) -> dict:
    timings = {}
    client = _get_qdrant_client()

    t0 = time.perf_counter()
    ensure_qdrant_collection(client)
    timings["collection_check"] = round((time.perf_counter() - t0) * 1000)

    all_chunks = []
    all_metadatas = []

    for page_num in range(len(pdf)):
        page_text = extract_page_text(pdf[page_num])
        if page_text.strip():
            chunks = chunk_text(page_text)
            for i, chunk in enumerate(chunks):
                all_chunks.append(chunk)
                all_metadatas.append({
                    "doc_id": str(doc.id),
                    "user_id": str(doc.user_id),
                    "page_number": page_num + 1,
                    "chunk_index": i,
                    "content_type": "text",
                })

    timings["chunk_count"] = len(all_chunks)

    if all_chunks:
        t0 = time.perf_counter()
        embeddings = get_embeddings_batched(all_chunks)
        timings["embedding_api"] = round((time.perf_counter() - t0) * 1000)

        t0 = time.perf_counter()
        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={"content": text, **meta},
            )
            for text, meta, vector in zip(all_chunks, all_metadatas, embeddings)
        ]

        client.upsert(
            collection_name=settings.qdrant_collection,
            points=points,
        )
        timings["qdrant_upsert"] = round((time.perf_counter() - t0) * 1000)
    else:
        timings["embedding_api"] = 0
        timings["qdrant_upsert"] = 0

    return timings
