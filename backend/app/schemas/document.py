import uuid
from datetime import datetime

from pydantic import BaseModel


class DocumentCreate(BaseModel):
    filename: str
    s3_key: str


class DocumentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    page_count: int | None
    status: str
    processing_step: str | None = None
    processing_progress: int = 0
    error_message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int


class UploadURLRequest(BaseModel):
    filename: str
    content_type: str = "application/pdf"


class UploadURLResponse(BaseModel):
    upload_url: str
    s3_key: str
