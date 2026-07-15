#!/usr/bin/env bash
set -e

echo "[entrypoint] Waiting for database to be reachable..."

# Run migrations (retry up to 30 times ~ 60s)
for i in $(seq 1 30); do
    if alembic upgrade head; then
        echo "[entrypoint] Migrations applied successfully."
        break
    fi
    echo "[entrypoint] Migration attempt $i failed, retrying in 2s..."
    sleep 2
    if [ "$i" -eq 30 ]; then
        echo "[entrypoint] FATAL: migrations did not complete after 30 attempts."
        exit 1
    fi
done

echo "[entrypoint] Starting uvicorn..."
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "${PORT:-8000}" \
    --workers "${WEB_CONCURRENCY:-1}" \
    --proxy-headers \
    --forwarded-allow-ips='*' \
    --timeout-keep-alive 65