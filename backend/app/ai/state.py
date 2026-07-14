"""LangGraph state definition — shared state across all agents."""

from typing import Annotated, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages


class AgentState(TypedDict):
    """State passed between nodes in the LangGraph workflow."""

    # Input
    question: str
    user_id: str
    document_ids: list[str] | None
    conversation_id: str | None
    conversation_history: list[BaseMessage]

    # Intent detection
    intent: str

    # Retrieval
    retrieved_docs: list[dict]
    context: str | None

    # Answer generation
    answer: str
    sources: list[dict]

    # Metadata
    timings: dict[str, int]
    error: str | None

    # Messages (for agent communication)
    messages: Annotated[list[BaseMessage], add_messages]
