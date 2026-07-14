"""LangGraph orchestrator — main entry point for the AI pipeline."""

import json
import logging
import threading
import time
from collections.abc import AsyncGenerator

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.ai.prompts import DOCUMENT_INTENTS
from app.ai.state import AgentState
from app.core.config import settings

logger = logging.getLogger("pdfsage.orchestrator")


async def run_pipeline(
    question: str,
    user_id: str,
    document_ids: list[str] | None = None,
    conversation_id: str | None = None,
    conversation_history: list | None = None,
) -> AsyncGenerator[str, None]:
    """Run the full pipeline and yield SSE events.

    Runs agents directly for streaming support (graph.invoke blocks until done).
    Uses plain threads for LLM calls to avoid httpx + asyncio.to_thread issues.
    """
    pipeline_start = time.monotonic()
    timings: dict[str, int] = {}

    if not settings.openrouter_api_key:
        yield _sse_event("content", "Error: AI service not configured. Set OPENROUTER_API_KEY in backend/.env")
        yield _sse_event("sources", [])
        yield _sse_event("done", {})
        return

    # Build conversation history as LangChain messages
    lc_history = _build_conversation_history(conversation_history)

    state: AgentState = {
        "question": question,
        "user_id": user_id,
        "document_ids": document_ids,
        "conversation_id": conversation_id,
        "conversation_history": lc_history,
        "intent": "",
        "retrieved_docs": [],
        "context": None,
        "answer": "",
        "sources": [],
        "timings": {},
        "error": None,
        "messages": [],
    }

    try:
        # Step 1: Intent detection
        from app.ai.agents import detect_intent_agent
        yield _sse_event("status", "Analyzing your question...")
        state = detect_intent_agent(state)
        timings["intent_ms"] = state["timings"].get("intent_ms", 0)
        yield _sse_event("intent", {"intent": state["intent"], "intent_ms": timings["intent_ms"]})
        logger.info("Intent=%s | q='%s'", state["intent"], question[:80])

        # Step 2: Retrieval (if needed)
        if state["intent"] in DOCUMENT_INTENTS and document_ids:
            from app.ai.agents import retrieval_agent
            yield _sse_event("status", "Searching document...")
            state = retrieval_agent(state)
            timings["retrieval_ms"] = state["timings"].get("retrieval_ms", 0)
            retrieved_count = len(state.get("retrieved_docs", []))
            logger.info("Retrieved %d chunks", retrieved_count)
            if retrieved_count == 0:
                yield _sse_event("status", "No matching content found...")

        # Step 3: LLM answer via plain thread
        yield _sse_event("status", "Thinking...")
        t_llm = time.monotonic()
        answer = await _run_in_thread(_call_llm_sync, state)
        state["answer"] = answer
        timings["llm_ms"] = int((time.monotonic() - t_llm) * 1000)

        # Step 4: Citations
        from app.ai.agents import citation_agent
        state = citation_agent(state)

        # Yield content and sources
        yield _sse_event("content", state["answer"])
        yield _sse_event("sources", state.get("sources", []))

    except Exception as e:
        logger.error("Pipeline failed: %s", e)
        yield _sse_event("content", f"Error: {e}")

    timings["total_ms"] = int((time.monotonic() - pipeline_start) * 1000)
    yield _sse_event("timing", timings)
    yield _sse_event("done", {})


def _build_conversation_history(conversation_history: list | None) -> list:
    """Convert conversation history to LangChain message format."""
    if not conversation_history:
        return []

    lc_messages = []
    for msg in conversation_history[-8:]:  # Last 8 messages
        if isinstance(msg, HumanMessage):
            lc_messages.append(msg)
        elif isinstance(msg, AIMessage):
            lc_messages.append(msg)
        elif isinstance(msg, dict):
            role = msg.get("role", "")
            content = msg.get("content", "")
            if role == "user":
                lc_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                lc_messages.append(AIMessage(content=content))
        elif hasattr(msg, 'role') and hasattr(msg, 'content'):
            # Pydantic model (ConversationMessage)
            if msg.role == "user":
                lc_messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                lc_messages.append(AIMessage(content=msg.content))

    return lc_messages


def _call_llm_sync(state: AgentState) -> str:
    """Synchronous LLM call — runs in a plain thread."""
    from app.ai.llm import invoke_llm
    from app.ai.prompts import get_prompt_for_intent

    question = state["question"]
    intent = state.get("intent", "general_knowledge")
    context = state.get("context")
    conversation_history = state.get("conversation_history", [])

    system_prompt = get_prompt_for_intent(intent)

    # Build context block
    context_block = ""
    if context and intent in DOCUMENT_INTENTS:
        context_block = f"\n\n## RETRIEVED DOCUMENT CONTEXT\n{context}\n"

    system_content = system_prompt + context_block

    # Detect user's language
    from app.ai.agents import _detect_language_hint
    lang_hint = _detect_language_hint(question)
    if lang_hint:
        system_content += f"\n\n## IMPORTANT: The user is writing in {lang_hint}. Reply in {lang_hint}."

    messages = [SystemMessage(content=system_content)]

    for msg in conversation_history[-8:]:
        if isinstance(msg, HumanMessage):
            messages.append(HumanMessage(content=msg.content))
        elif isinstance(msg, AIMessage):
            messages.append(AIMessage(content=msg.content))

    messages.append(HumanMessage(content=question))

    return invoke_llm(messages, max_tokens=1536)


async def _run_in_thread(func, *args):
    """Run a sync function in a plain thread with its own event loop."""
    import asyncio as aio
    result = [None]
    error = [None]

    def wrapper():
        loop = aio.new_event_loop()
        aio.set_event_loop(loop)
        try:
            result[0] = func(*args)
        except Exception as e:
            error[0] = e
        finally:
            loop.close()

    t = threading.Thread(target=wrapper, daemon=True)
    t.start()
    t.join(timeout=60)

    if error[0]:
        raise error[0]
    return result[0]


def _sse_event(event_type: str, data) -> str:
    """Format data as SSE JSON event."""
    payload = {"type": event_type}
    if isinstance(data, dict):
        payload.update(data)
    elif isinstance(data, list):
        payload["sources"] = data
    else:
        payload["content"] = str(data)
    return json.dumps(payload)
