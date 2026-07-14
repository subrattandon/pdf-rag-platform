import logging

import httpx
from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings

router = APIRouter(tags=["health"])
logger = logging.getLogger(__name__)


@router.get("/health")
async def health_check():
    """Health check endpoint that verifies all service connections."""
    services = {}

    # Check PostgreSQL
    try:
        from app.core.database import async_session
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
        services["postgresql"] = "healthy"
    except Exception as e:
        logger.warning("PostgreSQL health check failed: %s", e)
        services["postgresql"] = f"unhealthy: {e}"

    # Check Redis
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.redis_url)
        await r.ping()
        await r.aclose()
        services["redis"] = "healthy"
    except Exception as e:
        logger.warning("Redis health check failed: %s", e)
        services["redis"] = f"unhealthy: {e}"

    # Check Qdrant
    if settings.qdrant_url and settings.qdrant_api_key:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{settings.qdrant_url.rstrip('/')}/collections",
                    headers={"api-key": settings.qdrant_api_key},
                    timeout=5.0,
                )
                if resp.status_code == 200:
                    services["qdrant"] = "healthy"
                else:
                    services["qdrant"] = f"unhealthy: HTTP {resp.status_code}"
        except Exception as e:
            logger.warning("Qdrant health check failed: %s", e)
            services["qdrant"] = f"unhealthy: {e}"
    else:
        services["qdrant"] = "not_configured"

    # Check OpenRouter
    if settings.openrouter_api_key:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{settings.openrouter_base_url}/models",
                    headers={"Authorization": f"Bearer {settings.openrouter_api_key}"},
                    timeout=5.0,
                )
                if resp.status_code == 200:
                    services["openrouter"] = "healthy"
                else:
                    services["openrouter"] = f"unhealthy: HTTP {resp.status_code}"
        except Exception as e:
            logger.warning("OpenRouter health check failed: %s", e)
            services["openrouter"] = f"unhealthy: {e}"
    else:
        services["openrouter"] = "not_configured"

    # Check Clerk Auth
    if settings.clerk_secret_key:
        services["clerk"] = "configured"
    else:
        services["clerk"] = "not_configured"

    # Determine overall status
    all_healthy = all(
        v == "healthy" or v == "configured" or v == "not_configured"
        for v in services.values()
    )
    critical_services = ["postgresql", "redis"]
    critical_healthy = all(
        services.get(s) == "healthy" for s in critical_services
    )

    overall_status = "healthy" if critical_healthy else "degraded"
    if not all_healthy and critical_healthy:
        overall_status = "degraded"

    return {
        "status": overall_status,
        "services": services,
        "version": "0.1.0",
    }


@router.get("/health/ready")
async def readiness_check():
    """Kubernetes-style readiness check — only checks critical services."""
    try:
        from app.core.database import async_session
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        logger.error("Readiness check failed: %s", e)
        return {"status": "not_ready", "error": str(e)}


@router.get("/health/live")
async def liveness_check():
    """Simple liveness check."""
    return {"status": "alive"}
