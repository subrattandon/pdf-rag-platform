import logging
import time
import uuid
from pathlib import Path

from app.workers import celery_app

logger = logging.getLogger(__name__)

LOCAL_UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"

PROCESSING_STEPS = [
    ("uploading", "Uploading file", 10),
    ("extracting", "Extracting text from PDF", 30),
    ("chunking", "Splitting text into chunks", 50),
    ("embedding", "Generating vector embeddings", 70),
    ("indexing", "Indexing in vector database", 90),
    ("ready", "Processing complete", 100),
]


def _get_sync_engine():
    from sqlalchemy import create_engine

    from app.core.config import settings
    return create_engine(settings.database_url_sync, pool_pre_ping=True, pool_size=2)


_sync_engine = None


def get_sync_engine():
    global _sync_engine
    if _sync_engine is None:
        _sync_engine = _get_sync_engine()
    return _sync_engine


@celery_app.task(bind=True, name="process_pdf")
def process_pdf(self, document_id: str, s3_key: str, user_id: str):
    from sqlalchemy.orm import Session

    from app.models.document import Document

    t_start = time.perf_counter()
    timings = {}

    engine = get_sync_engine()

    with Session(engine) as db:
        doc = db.get(Document, uuid.UUID(document_id))
        if not doc:
            return {"error": "Document not found"}

        doc.status = "processing"
        doc.processing_step = "uploading"
        doc.processing_progress = 10
        db.commit()

        try:
            # Step 1: Download PDF
            t0 = time.perf_counter()
            pdf_bytes = _download_pdf(s3_key)
            timings["download"] = round((time.perf_counter() - t0) * 1000)

            # Step 2: Extract text
            t0 = time.perf_counter()
            import fitz  # PyMuPDF
            pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
            doc.page_count = len(pdf)
            timings["extract_text"] = round((time.perf_counter() - t0) * 1000)

            # Step 3: Chunk + Embed + Upsert (single function, single QdrantClient)
            t0 = time.perf_counter()
            from app.workers.embeddings import process_document_embeddings
            embedding_timings = process_document_embeddings(doc, pdf, db)
            timings["embeddings"] = embedding_timings
            timings["chunk_embed_upsert"] = round((time.perf_counter() - t0) * 1000)

            # Step 4: Final status update (single commit for all progress)
            doc.status = "ready"
            doc.processing_step = "ready"
            doc.processing_progress = 100
            db.commit()

            timings["total"] = round((time.perf_counter() - t_start) * 1000)
            logger.info(
                "PDF processed in %dms | download=%dms extract=%dms chunk_embed_upsert=%dms | %s",
                timings["total"],
                timings["download"],
                timings["extract_text"],
                timings["chunk_embed_upsert"],
                doc.filename,
            )
            return {"status": "ready", "document_id": document_id, "timings": timings}

        except Exception as e:
            logger.error("PDF processing failed for doc %s: %s", document_id, e)
            doc.status = "failed"
            doc.error_message = str(e)
            db.commit()
            return {"error": str(e)}


def _download_pdf(s3_key: str) -> bytes:
    from app.core.config import settings

    r2_configured = bool(settings.r2_access_key_id) and settings.r2_access_key_id != "your_r2_access_key_id"

    if r2_configured:
        from app.workers.r2 import download_pdf
        return download_pdf(s3_key)
    else:
        file_path = LOCAL_UPLOAD_DIR / s3_key
        if not file_path.exists():
            raise FileNotFoundError(f"PDF file not found: {s3_key}")
        return file_path.read_bytes()
