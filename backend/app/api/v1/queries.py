import json
import logging
import time
import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.ai.orchestrator import run_pipeline
from app.core.config import settings
from app.core.database import async_session, get_db
from app.core.security import get_current_user_id
from app.models.query import Query
from app.models.usage import Usage
from app.schemas.query import (
    ConversationMessage,
    QueryHistoryResponse,
    QueryRequest,
)

logger = logging.getLogger("pdfsage.query")

router = APIRouter(prefix="/query", tags=["query"])


@router.post("")
async def query_documents(
    body: QueryRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    pipeline_start = time.monotonic()
    timings: dict[str, int] = {}

    if not settings.openrouter_api_key:
        raise HTTPException(
            status_code=503,
            detail="AI service not configured. Set OPENROUTER_API_KEY in backend/.env",
        )
    if not settings.qdrant_url or not settings.qdrant_api_key:
        raise HTTPException(
            status_code=503,
            detail="Vector database not configured. Set QDRANT_URL and QDRANT_API_KEY in backend/.env",
        )

    async def event_generator():
        nonlocal timings
        full_answer = ""
        sources_data: list[dict] = []

        # ── Fetch conversation history ──────────────────────────
        t_hist = time.monotonic()
        conversation_history = []
        if body.conversation_id:
            history_stmt = (
                select(Query)
                .where(Query.conversation_id == body.conversation_id)
                .where(Query.user_id == uuid.UUID(user_id))
                .order_by(Query.created_at.asc())
                .limit(10)
            )
            history_result = await db.execute(history_stmt)
            history_queries = history_result.scalars().all()
            for hq in history_queries:
                conversation_history.append(ConversationMessage(role="user", content=hq.question))
                conversation_history.append(ConversationMessage(role="assistant", content=hq.answer))
        timings["history_fetch_ms"] = int((time.monotonic() - t_hist) * 1000)

        # ── Run LangGraph pipeline ──────────────────────────────
        doc_ids_str = [str(d) for d in body.document_ids] if body.document_ids else None

        async for event in run_pipeline(
            question=body.question,
            user_id=user_id,
            document_ids=doc_ids_str,
            conversation_id=body.conversation_id,
            conversation_history=conversation_history,
        ):
            data = json.loads(event)

            if data["type"] == "content":
                full_answer += data.get("content", "")
                yield event
            elif data["type"] == "status":
                yield event
            elif data["type"] == "intent":
                yield event
            elif data["type"] == "sources":
                sources_data = data.get("sources", data.get("data", []))
            elif data["type"] == "timing":
                timings.update(data.get("timings", {}))
            elif data["type"] == "done":
                pass

        timings["total_ms"] = int((time.monotonic() - pipeline_start) * 1000)

        logger.info(
            "TIMING | q='%s' | total=%dms",
            body.question[:60], timings["total_ms"],
        )

        # ── Persist query + usage ──────────────────────────────
        doc_ids_for_storage = doc_ids_str or []

        async with async_session() as db_session:
            try:
                query_record = Query(
                    user_id=uuid.UUID(user_id),
                    document_ids=[uuid.UUID(d) for d in doc_ids_for_storage] if doc_ids_for_storage else [],
                    conversation_id=body.conversation_id,
                    question=body.question,
                    answer=full_answer,
                    sources=sources_data,
                )
                db_session.add(query_record)

                today = date.today().replace(day=1)
                usage_stmt = select(Usage).where(
                    Usage.user_id == uuid.UUID(user_id), Usage.month == today
                )
                usage_result = await db_session.execute(usage_stmt)
                usage = usage_result.scalar_one_or_none()
                if usage:
                    usage.queries_made += 1
                else:
                    usage = Usage(
                        user_id=uuid.UUID(user_id),
                        month=today,
                        queries_made=1,
                    )
                    db_session.add(usage)

                await db_session.commit()
            except Exception as e:
                logger.error("Failed to persist query for user %s: %s", user_id, e)
                await db_session.rollback()

        yield json.dumps({"type": "sources", "sources": sources_data})
        yield json.dumps({"type": "timing", "timings": timings})
        yield json.dumps({"type": "done"})

    return EventSourceResponse(event_generator())


@router.get("/history", response_model=QueryHistoryResponse)
async def query_history(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Query)
        .where(Query.user_id == uuid.UUID(user_id))
        .order_by(Query.created_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    queries = result.scalars().all()
    return QueryHistoryResponse(queries=queries, total=len(queries))
