import logging
import uuid
from datetime import date
from pathlib import Path

import boto3
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.document import Document
from app.models.usage import Usage
from app.schemas.document import (
    DocumentCreate,
    DocumentListResponse,
    DocumentResponse,
    UploadURLRequest,
    UploadURLResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])

LOCAL_UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
LOCAL_UPLOAD_DIR.mkdir(exist_ok=True)


def _r2_configured() -> bool:
    return bool(settings.r2_access_key_id) and settings.r2_access_key_id != "your_r2_access_key_id"


def _get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
    )


@router.post("/upload-url", response_model=UploadURLResponse)
async def get_upload_url(
    body: UploadURLRequest,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    s3_key = f"uploads/{user_id}/{uuid.uuid4()}.pdf"

    if _r2_configured():
        s3 = _get_r2_client()
        upload_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.r2_bucket_name,
                "Key": s3_key,
                "ContentType": body.content_type,
            },
            ExpiresIn=900,
        )
    else:
        base_url = str(request.base_url).rstrip("/")
        upload_url = f"{base_url}/api/v1/documents/local-upload/{s3_key}"

    return UploadURLResponse(upload_url=upload_url, s3_key=s3_key)


@router.put("/local-upload/{s3_key:path}")
async def local_upload(s3_key: str, request: Request):
    body = await request.body()
    # Sanitize path to prevent directory traversal
    resolved = (LOCAL_UPLOAD_DIR / s3_key).resolve()
    if not str(resolved).startswith(str(LOCAL_UPLOAD_DIR.resolve())):
        raise HTTPException(status_code=400, detail="Invalid file path")
    file_path = resolved
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(body)
    return {"status": "ok", "s3_key": s3_key}


async def _delete_from_qdrant(doc_id: str, user_id: str):
    try:
        from qdrant_client import QdrantClient
        from qdrant_client.models import FieldCondition, Filter, MatchValue
        client = QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)
        client.delete(
            collection_name=settings.qdrant_collection,
            points_selector=Filter(
                must=[
                    FieldCondition(key="doc_id", match=MatchValue(value=doc_id)),
                    FieldCondition(key="user_id", match=MatchValue(value=user_id)),
                ]
            ),
        )
    except Exception as e:
        logger.error("Failed to delete vectors from Qdrant for doc %s: %s", doc_id, e)


def _delete_local_file(s3_key: str):
    try:
        file_path = LOCAL_UPLOAD_DIR / s3_key
        if file_path.exists():
            file_path.unlink()
    except OSError as e:
        logger.error("Failed to delete local file %s: %s", s3_key, e)


def _delete_from_r2(s3_key: str):
    if _r2_configured():
        try:
            s3 = _get_r2_client()
            s3.delete_object(Bucket=settings.r2_bucket_name, Key=s3_key)
        except Exception as e:
            logger.error("Failed to delete file from R2 for key %s: %s", s3_key, e)


@router.post("", response_model=DocumentResponse, status_code=201)
async def create_document(
    body: DocumentCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(func.count()).where(Document.user_id == uuid.UUID(user_id))
    result = await db.execute(stmt)
    count = result.scalar()
    if count >= 5:
        raise HTTPException(status_code=403, detail="Free tier limit reached (5 PDFs)")

    openrouter_configured = bool(settings.openrouter_api_key)
    qdrant_configured = bool(settings.qdrant_url) and bool(settings.qdrant_api_key)
    services_ready = openrouter_configured and qdrant_configured

    doc = Document(
        user_id=uuid.UUID(user_id),
        filename=body.filename,
        s3_key=body.s3_key,
        status="processing" if services_ready else "ready",
    )
    db.add(doc)
    await db.flush()
    await db.refresh(doc)

    if services_ready:
        try:
            from app.workers.pdf_processor import process_pdf
            process_pdf.delay(str(doc.id), body.s3_key, user_id)
        except Exception as e:
            logger.error("Failed to start processing for doc %s: %s", doc.id, e)
            doc.status = "failed"
            doc.error_message = "Failed to start processing"
            await db.flush()

    today = date.today().replace(day=1)
    usage_stmt = select(Usage).where(
        Usage.user_id == uuid.UUID(user_id), Usage.month == today
    )
    usage_result = await db.execute(usage_stmt)
    usage = usage_result.scalar_one_or_none()
    if usage:
        usage.pdf_uploads += 1
    else:
        usage = Usage(
            user_id=uuid.UUID(user_id),
            month=today,
            pdf_uploads=1,
            pages_processed=doc.page_count or 0,
        )
        db.add(usage)

    return doc


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Document)
        .where(Document.user_id == uuid.UUID(user_id))
        .order_by(Document.created_at.desc())
    )
    result = await db.execute(stmt)
    docs = result.scalars().all()
    return DocumentListResponse(documents=docs, total=len(docs))


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Document).where(
        Document.id == doc_id, Document.user_id == uuid.UUID(user_id)
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/{doc_id}/pdf")
async def get_document_pdf(
    doc_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Serve the PDF file for a document."""
    stmt = select(Document).where(
        Document.id == doc_id, Document.user_id == uuid.UUID(user_id)
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Try R2 first
    if _r2_configured():
        try:
            s3 = _get_r2_client()
            presigned_url = s3.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": settings.r2_bucket_name,
                    "Key": doc.s3_key,
                },
                ExpiresIn=3600,
            )
            import httpx
            async with httpx.AsyncClient(follow_redirects=True) as client:
                resp = await client.get(presigned_url)
                if resp.status_code == 200:
                    return StreamingResponse(
                        iter([resp.content]),
                        media_type="application/pdf",
                        headers={
                            "Content-Disposition": f'inline; filename="{doc.filename}"',
                            "Content-Length": str(len(resp.content)),
                        },
                    )
        except Exception as e:
            logger.warning("Failed to fetch PDF from R2: %s, falling back to local", e)

    # Local storage fallback
    file_path = LOCAL_UPLOAD_DIR / doc.s3_key
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on disk")

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=doc.filename,
    )


@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Document).where(
        Document.id == doc_id, Document.user_id == uuid.UUID(user_id)
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    await _delete_from_qdrant(str(doc.id), user_id)
    _delete_local_file(doc.s3_key)
    _delete_from_r2(doc.s3_key)

    await db.delete(doc)
