"""LangGraph StateGraph — main orchestration workflow."""

import logging

from langgraph.graph import END, StateGraph

from app.ai.agents import (
    answer_agent,
    citation_agent,
    detect_intent_agent,
    retrieval_agent,
)
from app.ai.state import AgentState

logger = logging.getLogger("pdfsage.graph")


def should_retrieve(state: AgentState) -> str:
    """Route: should we retrieve documents or go straight to answer?"""
    intent = state.get("intent", "")
    document_intents = {
        "document_qa", "document_summary", "document_analysis",
        "document_translation", "document_rewrite",
    }
    if intent in document_intents and state.get("document_ids"):
        return "retrieve"
    return "answer"


def build_graph() -> StateGraph:
    """Build the LangGraph StateGraph.

    Flow:
    1. detect_intent → Classify user question
    2. should_retrieve → Route based on intent
    3. retrieval_agent → Fetch relevant chunks (if document intent)
    4. answer_agent → Generate answer with LLM
    5. citation_agent → Format citations
    6. END
    """
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("detect_intent", detect_intent_agent)
    workflow.add_node("retrieval", retrieval_agent)
    workflow.add_node("answer", answer_agent)
    workflow.add_node("citations", citation_agent)

    # Set entry point
    workflow.set_entry_point("detect_intent")

    # Add conditional routing
    workflow.add_conditional_edges(
        "detect_intent",
        should_retrieve,
        {
            "retrieve": "retrieval",
            "answer": "answer",
        },
    )

    # Retrieval → Answer
    workflow.add_edge("retrieval", "answer")

    # Answer → Citations → END
    workflow.add_edge("answer", "citations")
    workflow.add_edge("citations", END)

    return workflow.compile()


# Compiled graph singleton
_graph = None


def get_graph():
    """Get compiled LangGraph."""
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph
