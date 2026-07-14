from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_name: str = "PDF Sage"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = ""
    database_url_sync: str = ""

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Clerk Auth
    clerk_secret_key: str = ""
    clerk_jwks_url: str = ""
    clerk_issuer: str = ""

    # LLM (OpenRouter)
    openrouter_api_key: str = ""
    openrouter_model: str = "meta-llama/llama-3.1-8b-instruct"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Embeddings (via OpenRouter)
    embedding_model: str = "openai/text-embedding-3-small"
    embedding_dim: int = 1536

    # Vector DB (Qdrant)
    qdrant_url: str = ""
    qdrant_api_key: str = ""
    qdrant_collection: str = "document_chunks"

    # Cloudflare R2
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "pdfsage-uploads"
    r2_endpoint_url: str = ""

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_pro_price_id: str = ""
    stripe_enterprise_price_id: str = ""

    # Sentry
    sentry_dsn: str = ""

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # LangChain / LangGraph
    langchain_tracing_v2: bool = False
    langchain_api_key: str = ""
    langchain_project: str = "pdf-sage"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
