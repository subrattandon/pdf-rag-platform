# ---- build stage ----
FROM python:3.11-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini .
COPY scripts/entrypoint.sh ./scripts/entrypoint.sh

RUN pip install --no-cache-dir -e . psycopg2-binary \
    && chmod +x ./scripts/entrypoint.sh

# ---- runtime stage ----
FROM python:3.11-slim AS runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

RUN groupadd -r app && useradd -r -g app -d /app -s /sbin/nologin app \
    && mkdir -p /app/app/uploads \
    && chown -R app:app /app

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app /app

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request,sys; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health/live', timeout=5)" || exit 1

CMD ["bash", "./scripts/entrypoint.sh"]