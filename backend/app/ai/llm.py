"""LangChain LLM module — OpenRouter as OpenAI-compatible endpoint."""

import logging

import httpx
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


def get_openai_client() -> OpenAI:
    """Get OpenAI-compatible client configured for OpenRouter."""
    http_client = httpx.Client(
        timeout=httpx.Timeout(30.0, connect=10.0),
    )
    return OpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        http_client=http_client,
        max_retries=2,
    )


def invoke_llm(
    messages: list,
    model: str | None = None,
    temperature: float = 0.3,
    max_tokens: int = 512,
) -> str:
    """Invoke LLM directly via OpenAI client.

    Tries the primary model, then falls back to alternative models on failure.
    """
    client = get_openai_client()

    # Convert LangChain messages to OpenAI format
    oai_messages = []
    for msg in messages:
        if isinstance(msg, SystemMessage):
            oai_messages.append({"role": "system", "content": msg.content})
        elif isinstance(msg, HumanMessage):
            oai_messages.append({"role": "user", "content": msg.content})
        elif isinstance(msg, AIMessage):
            oai_messages.append({"role": "assistant", "content": msg.content})

    models_to_try = [
        model or settings.openrouter_model,
        "meta-llama/llama-3.1-8b-instruct",
        "google/gemma-4-26b-a4b-it:free",
    ]

    last_error = None
    for attempt_model in models_to_try:
        try:
            resp = client.chat.completions.create(
                model=attempt_model,
                messages=oai_messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return resp.choices[0].message.content
        except Exception as e:
            logger.warning("LLM call failed with model %s: %s", attempt_model, e)
            last_error = e
            continue

    raise RuntimeError(f"All LLM models failed. Last error: {last_error}")
