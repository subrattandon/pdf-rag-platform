from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Lazy engine — only created when a valid DATABASE_URL is provided.
# In CI or test environments without a DB, imports won't crash.
_engine = None
async_session = None


def _get_engine():
    global _engine, async_session  # noqa: PLW0603
    if _engine is None:
        if not settings.database_url:
            raise RuntimeError(
                "DATABASE_URL is not set. "
                "Set the DATABASE_URL environment variable before starting the app."
            )
        _engine = create_async_engine(
            settings.database_url,
            echo=settings.debug,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=3600,
        )
        async_session = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)
    return _engine


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    _get_engine()
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
