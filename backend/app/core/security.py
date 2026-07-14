import logging
import time

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)

_jwks_cache: dict | None = None
_jwks_cache_time: float = 0
_JWKS_CACHE_TTL = 300  # 5 minutes


async def _get_signing_key(kid: str) -> str:
    """Fetch signing key from Clerk JWKS endpoint with caching."""
    global _jwks_cache, _jwks_cache_time  # noqa: PLW0603

    from app.core.config import settings

    if not settings.clerk_jwks_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Clerk JWKS URL not configured.",
        )

    now = time.monotonic()
    if _jwks_cache is None or (now - _jwks_cache_time) > _JWKS_CACHE_TTL:
        async with httpx.AsyncClient() as client:
            resp = await client.get(settings.clerk_jwks_url)
            resp.raise_for_status()
            _jwks_cache = resp.json()
            _jwks_cache_time = now

    for key in _jwks_cache.get("keys", []):
        if key.get("kid") == kid:
            return jwt.algorithms.RSAAlgorithm.from_jwk(key)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unable to find matching signing key.",
    )


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Verify Clerk JWT and return the user ID (sub claim).
    
    For testing purposes, if no credentials are provided, returns a demo user ID.
    In production, this should require valid Clerk JWT.
    """
    from app.core.config import settings

    # For testing: allow unauthenticated access with demo user
    if not credentials:
        logger.info("No credentials provided, using demo user for testing")
        return "00000000-0000-0000-0000-000000000001"

    if not settings.clerk_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication not configured. Clerk secret key is missing.",
        )

    token = credentials.credentials

    try:
        # Decode header to get kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format.",
            )

        # Get the signing key from JWKS
        signing_key = _get_signing_key(kid)

        # Verify the token
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer or None,
            options={"verify_aud": False},
        )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing user ID.",
            )

        return user_id

    except JWTError as e:
        logger.warning("JWT verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {e}",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Authentication error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error.",
        )
