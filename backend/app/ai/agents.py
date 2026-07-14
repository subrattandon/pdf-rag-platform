"""LangGraph agents — individual agent functions for each pipeline stage."""

import logging
import re
import time

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.ai.prompts import (
    DOCUMENT_INTENTS,
    get_prompt_for_intent,
)
from app.ai.retriever import get_retriever
from app.ai.state import AgentState

logger = logging.getLogger("pdfsage.agents")


# ─── Intent Detection Agent ──────────────────────────────────────

# Follow-up patterns (language-agnostic)
FOLLOWUP_PATTERNS = r"\b(explain more|tell me more|what about|can you simplify|continue|example|why|how so|elaborate|short version|brief|tldr|one line|one-liner|in short|summarize|summary|key points|notes|revision)\b"

# Summary patterns
SUMMARY_PATTERNS = r"\b(summarize|summary|tldr|tl;dr|brief overview|main points|key takeaways|executive summary|one-line summary|one line summary|revision notes|study notes|bullet points|key points)\b"

# Analysis patterns
ANALYSIS_PATTERNS = r"\b(analyze|analysis|strengths|weaknesses|pros|cons|evaluate|assess|review|risks|advantages|disadvantages|conclusion|recommendations)\b"

# Translation patterns
TRANSLATION_PATTERNS = r"\b(translate|translation|in spanish|in french|in german|in chinese|hindi me|marathi me|tamil me)\b"

# Rewrite patterns
REWRITE_PATTERNS = r"\b(rewrite|rephrase|paraphrase|simplify|improve|enhance)\b.*(this|the|writing|text|content|passage)\b"


def detect_intent_agent(state: AgentState) -> AgentState:
    """Classify user intent using fast regex patterns."""
    t0 = time.monotonic()
    question = state["question"]
    has_documents = bool(state.get("document_ids"))
    has_history = bool(state.get("conversation_history"))

    q = question.lower().strip()

    # Check for follow-up first (if there's conversation history)
    if has_history and re.search(FOLLOWUP_PATTERNS, q, re.IGNORECASE):
        intent = "follow_up"
        if has_documents:
            intent = "follow_up"  # Will use document context
        return {
            **state,
            "intent": intent,
            "timings": {**state.get("timings", {}), "intent_ms": int((time.monotonic() - t0) * 1000)},
        }

    # Check for summary
    if re.search(SUMMARY_PATTERNS, q, re.IGNORECASE):
        if has_documents:
            return {
                **state,
                "intent": "document_summary",
                "timings": {**state.get("timings", {}), "intent_ms": int((time.monotonic() - t0) * 1000)},
            }
        return {
            **state,
            "intent": "general_knowledge",
            "timings": {**state.get("timings", {}), "intent_ms": int((time.monotonic() - t0) * 1000)},
        }

    # Check for analysis
    if re.search(ANALYSIS_PATTERNS, q, re.IGNORECASE):
        if has_documents:
            return {
                **state,
                "intent": "document_analysis",
                "timings": {**state.get("timings", {}), "intent_ms": int((time.monotonic() - t0) * 1000)},
            }

    # Check for translation
    if re.search(TRANSLATION_PATTERNS, q, re.IGNORECASE):
        if has_documents:
            return {
                **state,
                "intent": "document_translation",
                "timings": {**state.get("timings", {}), "intent_ms": int((time.monotonic() - t0) * 1000)},
            }

    # Check for rewrite
    if re.search(REWRITE_PATTERNS, q, re.IGNORECASE):
        if has_documents:
            return {
                **state,
                "intent": "document_rewrite",
                "timings": {**state.get("timings", {}), "intent_ms": int((time.monotonic() - t0) * 1000)},
            }

    # Check for joke
    if re.search(r"\b(joke|funny|laugh|haha)\b", q, re.IGNORECASE):
        return {
            **state,
            "intent": "joke",
            "timings": {**state.get("timings", {}), "intent_ms": int((time.monotonic() - t0) * 1000)},
        }

    # Check for code
    if re.search(r"\b(write|generate|create|show|help)\s+(a |an |some )?(python|javascript|typescript|java|code|script|function|program)\b", q, re.IGNORECASE):
        return {
            **state,
            "intent": "code",
            "timings": {**state.get("timings", {}), "intent_ms": int((time.monotonic() - t0) * 1000)},
        }

    # Check for general chat
    if re.search(r"\b(hi|hello|hey|good morning|good evening|good night|how are you|what's up|thanks|thank you|bye|goodbye)\b", q, re.IGNORECASE):
        if has_documents:
            # Greeting with documents → treat as document_qa (maybe they want overview)
            return {
                **state,
                "intent": "document_qa",
                "timings": {**state.get("timings", {}), "intent_ms": int((time.monotonic() - t0) * 1000)},
            }
        return {
            **state,
            "intent": "general_chat",
            "timings": {**state.get("timings", {}), "intent_ms": int((time.monotonic() - t0) * 1000)},
        }

    # Default: if documents are provided, use document_qa
    intent = "document_qa" if has_documents else "general_knowledge"

    return {
        **state,
        "intent": intent,
        "timings": {**state.get("timings", {}), "intent_ms": int((time.monotonic() - t0) * 1000)},
    }


# ─── Retrieval Agent ─────────────────────────────────────────────

def retrieval_agent(state: AgentState) -> AgentState:
    """Retrieve relevant documents using LangChain retriever."""
    t0 = time.monotonic()
    intent = state.get("intent", "document_qa")
    user_id = state["user_id"]
    doc_ids = state.get("document_ids")
    question = state["question"]

    # Skip retrieval for general intents
    if intent not in DOCUMENT_INTENTS:
        return {
            **state,
            "retrieved_docs": [],
            "context": None,
            "timings": {**state.get("timings", {}), "retrieval_ms": 0},
        }

    # Skip if no Qdrant configured
    from app.core.config import settings
    if not settings.qdrant_url or not settings.qdrant_api_key:
        return {
            **state,
            "retrieved_docs": [],
            "context": None,
            "timings": {**state.get("timings", {}), "retrieval_ms": 0},
        }

    try:
        # For follow-ups, also include previous context in retrieval
        enhanced_question = question
        conversation_history = state.get("conversation_history", [])
        if intent == "follow_up" and conversation_history:
            # Get last user question for context
            last_user_msg = ""
            for msg in reversed(conversation_history):
                if isinstance(msg, HumanMessage) or (isinstance(msg, dict) and msg.get("role") == "user"):
                    last_user_msg = msg.content if isinstance(msg, HumanMessage) else msg.get("content", "")
                    break
            if last_user_msg:
                enhanced_question = f"{last_user_msg} {question}"

        retriever = get_retriever(user_id=user_id, doc_ids=doc_ids, k=10)
        docs = retriever.invoke(enhanced_question)

        # Convert to our format and rerank by score
        retrieved = []
        seen_content = set()
        for doc in docs:
            content = doc.page_content
            # Deduplicate chunks
            content_hash = content[:100]
            if content_hash in seen_content:
                continue
            seen_content.add(content_hash)
            retrieved.append({
                "content": content,
                "doc_id": doc.metadata.get("doc_id", ""),
                "page_number": doc.metadata.get("page_number", 0),
                "score": doc.metadata.get("score", 0),
            })

        # Rerank: top 8 by score (more chunks for synthesis)
        retrieved = sorted(retrieved, key=lambda x: x["score"], reverse=True)[:8]

        # Assemble context
        context = None
        if retrieved:
            context_parts = []
            for i, chunk in enumerate(retrieved):
                doc_short_id = chunk['doc_id'][:8]
                context_parts.append(
                    f"[Source {i+1}: Doc {doc_short_id}, Page {chunk['page_number']}]\n{chunk['content']}"
                )
            context = "\n\n".join(context_parts)

        elapsed = int((time.monotonic() - t0) * 1000)
        logger.info("Retrieval: %d chunks in %dms", len(retrieved), elapsed)

        return {
            **state,
            "retrieved_docs": retrieved,
            "context": context,
            "timings": {**state.get("timings", {}), "retrieval_ms": elapsed},
        }

    except Exception as e:
        logger.error("Retrieval failed: %s", e)
        return {
            **state,
            "retrieved_docs": [],
            "context": None,
            "error": f"Retrieval failed: {e}",
            "timings": {**state.get("timings", {}), "retrieval_ms": int((time.monotonic() - t0) * 1000)},
        }


# ─── Answer Generation Agent ─────────────────────────────────────

def answer_agent(state: AgentState) -> AgentState:
    """Generate answer using LLM with the universal conversational prompt."""
    t0 = time.monotonic()
    question = state["question"]
    intent = state.get("intent", "general_knowledge")
    context = state.get("context")
    conversation_history = state.get("conversation_history", [])

    # Get the universal system prompt
    system_prompt = get_prompt_for_intent(intent)

    # Build context block
    context_block = ""
    if context and intent in DOCUMENT_INTENTS:
        context_block = f"\n\n## RETRIEVED DOCUMENT CONTEXT\n{context}\n"

    # Build full system message
    system_content = system_prompt + context_block

    # Detect user's language from their message for the LLM
    lang_hint = _detect_language_hint(question)
    if lang_hint:
        system_content += f"\n\n## IMPORTANT: The user is writing in {lang_hint}. Reply in {lang_hint}."

    messages = [SystemMessage(content=system_content)]

    # Add conversation history (last 8 messages for good context)
    for msg in conversation_history[-8:]:
        if isinstance(msg, HumanMessage):
            messages.append(HumanMessage(content=msg.content))
        elif isinstance(msg, AIMessage):
            messages.append(AIMessage(content=msg.content))
        elif isinstance(msg, dict):
            role = msg.get("role", "")
            content = msg.get("content", "")
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))

    # Add current question
    messages.append(HumanMessage(content=question))

    # Generate answer
    try:
        from app.ai.llm import invoke_llm
        answer = invoke_llm(messages, max_tokens=1536)

        elapsed = int((time.monotonic() - t0) * 1000)
        logger.info("Answer generated in %dms", elapsed)

        return {
            **state,
            "answer": answer,
            "sources": state.get("retrieved_docs", []),
            "messages": [HumanMessage(content=question), AIMessage(content=answer)],
            "timings": {**state.get("timings", {}), "llm_ms": elapsed},
        }

    except Exception as e:
        logger.error("Answer generation failed: %s", e)
        return {
            **state,
            "answer": f"Error generating answer: {e}",
            "sources": [],
            "error": f"LLM failed: {e}",
            "timings": {**state.get("timings", {}), "llm_ms": int((time.monotonic() - t0) * 1000)},
        }


def _detect_language_hint(text: str) -> str:
    """Detect the primary language of the text for the LLM."""
    # Check for Devanagari script (Hindi, Marathi, etc.)
    devanagari_count = sum(1 for c in text if '\u0900' <= c <= '\u097F')
    if devanagari_count > len(text) * 0.3:
        return "Hindi (Devanagari script)"

    # Check for Tamil script
    tamil_count = sum(1 for c in text if '\u0B80' <= c <= '\u0BFF')
    if tamil_count > len(text) * 0.3:
        return "Tamil"

    # Check for Telugu script
    telugu_count = sum(1 for c in text if '\u0C00' <= c <= '\u0C7F')
    if telugu_count > len(text) * 0.3:
        return "Telugu"

    # Check for Bengali script
    bengali_count = sum(1 for c in text if '\u0980' <= c <= '\u09FF')
    if bengali_count > len(text) * 0.3:
        return "Bengali"

    # Check for Gujarati script
    gujarati_count = sum(1 for c in text if '\u0A80' <= c <= '\u0AFF')
    if gujarati_count > len(text) * 0.3:
        return "Gujarati"

    # Check for Gurmukhi script (Punjabi)
    gurmukhi_count = sum(1 for c in text if '\u0A00' <= c <= '\u0A7F')
    if gurmukhi_count > len(text) * 0.3:
        return "Punjabi (Gurmukhi script)"

    # Check for Malayalam script
    malayalam_count = sum(1 for c in text if '\u0D00' <= c <= '\u0D7F')
    if malayalam_count > len(text) * 0.3:
        return "Malayalam"

    # Check for Kannada script
    kannada_count = sum(1 for c in text if '\u0C80' <= c <= '\u0CFF')
    if kannada_count > len(text) * 0.3:
        return "Kannada"

    # Check for Urdu (Arabic script) — common Urdu words
    urdu_indicators = r"\b(kya|hai|mein|ka|ki|ke|ko|se|ne|ya|aur|par|ye|wo|jo|na|to|bhi|ab|phir|yahan|wahan|kaise|kab|kahan|kyun|iska|uska|inka|hamara|tumhara|mera|aapka)\b"
    if re.search(urdu_indicators, text, re.IGNORECASE):
        # Check if it also has Arabic script
        arabic_count = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
        if arabic_count > len(text) * 0.3:
            return "Urdu"
        return "Hinglish (Urdu/Hindi in Roman script)"

    # Check for Hinglish (Roman script with Hindi words)
    hinglish_indicators = r"\b(bhai|yaar|hai|mein|ka|ki|ke|kya|aur|ye|wo|jo|na|toh|phir|ab|yahan|wahan|kaise|kab|kahan|kyun|acha|theek|samajh|batao|suno|chalo|ruko|dekhlo|bata|bol|puchho|suno|accha|ji|haan|nahi|thik|ok|okay|please|thanks|thank you|bhai|dost|yaar|bro|dude|man|boss|sir|ji)\b"
    if re.search(hinglish_indicators, text, re.IGNORECASE):
        return "Hinglish"

    return ""  # Default: let the LLM decide


# ─── Citation Agent ──────────────────────────────────────────────

def citation_agent(state: AgentState) -> AgentState:
    """Format and validate citations in the answer."""
    answer = state.get("answer", "")
    sources = state.get("sources", [])

    # Ensure answer has proper citation format
    if sources and "[Source" not in answer and "[Page" not in answer:
        # Add source references at the end
        source_refs = []
        seen_pages = set()
        for src in sources:
            page = src.get('page_number', '?')
            if page not in seen_pages:
                seen_pages.add(page)
                source_refs.append(f"[Page {page}]")
        if source_refs:
            answer += "\n\n" + " ".join(source_refs)

    return {
        **state,
        "answer": answer,
        "sources": sources,
    }
