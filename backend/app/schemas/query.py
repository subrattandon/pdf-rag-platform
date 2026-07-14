import uuid
from datetime import datetime

from pydantic import BaseModel


class SourceReference(BaseModel):
    doc_id: uuid.UUID
    page: int
    chunk_text: str
    score: float


class QueryRequest(BaseModel):
    question: str
    document_ids: list[uuid.UUID] | None = None  # None = search all
    conversation_id: str | None = None  # For follow-up questions


class QueryResponse(BaseModel):
    id: uuid.UUID
    question: str
    answer: str
    sources: list[SourceReference]
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class QueryHistoryResponse(BaseModel):
    queries: list[QueryResponse]
    total: int
