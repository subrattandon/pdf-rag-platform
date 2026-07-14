FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml .
COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini .

RUN pip install --no-cache-dir -e . psycopg2-binary

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
