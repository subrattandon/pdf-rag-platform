# PDF Sage

> AI-powered document intelligence platform — upload PDFs, ask questions in natural language, and get instant answers with source citations.

![License: MIT](https://img.shields.io/badge/License-MIT-blueviolet)
![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB)
![Next.js 14](https://img.shields.io/badge/Next.js-14-000000)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-336791)
![Qdrant](https://img.shields.io/badge/Qdrant-Vector%20DB-DC382D)

---

## Features

| Feature | Description |
|---------|-------------|
| **Conversational AI** | Ask questions about your PDFs in natural language with accurate, grounded answers |
| **Source Citations** | Every answer includes exact page-number citations — verify sources instantly |
| **Multi-document Chat** | Query across multiple documents in a single conversation |
| **Smart Intent Routing** | LangGraph pipeline auto-selects the right agent (summary, analysis, translation, code, Q&A) |
| **Multilingual** | Detects and responds in Hindi, Hinglish, Tamil, Telugu, Bengali, and more |
| **Real-time Streaming** | SSE-based token-by-token streaming for instant feedback |
| **Built-in PDF Viewer** | Zoom, page navigation, thumbnails, and keyboard shortcuts |
| **Document Management** | Upload, organize, search, and delete documents |
| **Usage Tracking** | Monitor queries, storage, and plan limits |
| **Responsive Design** | Works seamlessly on desktop, tablet, and mobile |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Zustand, Framer Motion |
| **Backend** | Python 3.11, FastAPI, Uvicorn, LangGraph, LangChain, Celery |
| **Database** | PostgreSQL 16 (async via SQLAlchemy + asyncpg) |
| **Vector Database** | Qdrant (1536-dim cosine similarity) |
| **Cache / Queue** | Redis 7 (Celery broker + result backend) |
| **Auth** | Clerk (JWT RS256 via JWKS) — optional, runs in demo mode if unconfigured |
| **File Storage** | Cloudflare R2 (S3-compatible) — falls back to local filesystem |
| **AI / LLM** | OpenRouter (Llama 3.1, GPT-4, Claude, Gemini, Nemotron) |
| **Embeddings** | `text-embedding-3-small` (1536-dim) via OpenRouter |
| **Infrastructure** | Docker, Docker Compose, GitHub Actions CI/CD |

---

## Architecture

```
                         ┌─────────────────────────┐
                         │    User (browser)        │
                         └────────────┬─────────────┘
                                      │
                              ┌───────▼────────┐
                              │  Next.js 14    │  Frontend (port 3000)
                              │  Tailwind CSS  │
                              └───────┬────────┘
                                      │ HTTP / SSE
                              ┌───────▼────────┐
                              │  FastAPI       │  Backend API (port 8000)
                              │  LangGraph     │
                              └─┬───┬───┬───┬──┘
                ┌───────────────┘   │   │   └──────────────┐
                ▼                   ▼   ▼                  ▼
         ┌──────────┐      ┌──────────┐ ┌──────────┐  ┌────────────┐
         │PostgreSQL│      │  Redis   │ │ Qdrant   │  │ OpenRouter │
         │   16     │      │  (Celery)│ │ (vectors)│  │ (LLM+embed)│
         └──────────┘      └────┬─────┘ └──────────┘  └────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Celery Worker      │  PDF processing
                    │   (PyMuPDF + R2)     │
                    └─────────────────────┘
```

**RAG Pipeline:** Upload → PyMuPDF text extraction → Chunking (512 tokens, 50 overlap) → OpenRouter embeddings → Qdrant upsert → Query-time semantic search → LangGraph intent routing → LLM answer with citations

---

## Quick Start

### Prerequisites

Choose **one** of the following setup methods:

#### Option A — Docker (recommended for beginners)

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose
- [Node.js](https://nodejs.org/) 20+
- [Python](https://www.python.org/downloads/) 3.11+

#### Option B — Native (no Docker, faster iteration)

- [PostgreSQL](https://www.postgresql.org/download/) 16
- [Redis](https://redis.io/docs/getting-started/installation/) 7
- [Python](https://www.python.org/downloads/) 3.11+
- [Node.js](https://nodejs.org/) 20+

---

### 1. Clone & Configure

```bash
git clone https://github.com/subrattandon/pdf-rag-platform.git
cd pdf-rag-platform

# Create environment files from templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Now edit `backend/.env` and fill in your API keys (see [Environment Variables](#environment-variables) below).

> **Tip:** The app runs in **demo mode** without Clerk auth keys — all features work with a single demo user. Set Clerk keys only if you want real authentication.

---

### 2. Start Infrastructure

#### Option A — Docker

```bash
docker-compose up -d postgres redis
```

This starts PostgreSQL on port `5432` and Redis on port `6379`.

#### Option B — Native (macOS with Homebrew)

```bash
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis

# Create the database
createdb pdfsage
```

> **Note:** If your PostgreSQL doesn't have a `postgres` superuser role, create one:
> ```bash
> psql -d postgres -c "CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';"
> ```

---

### 3. Start the Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install dependencies
pip install -e . psycopg2-binary

# Run database migrations
alembic upgrade head

# Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at **http://localhost:8000**

API docs (Swagger UI) at **http://localhost:8000/docs**

---

### 4. Start the Celery Worker

In a **new terminal** (keep the backend running):

```bash
cd backend
source .venv/bin/activate

celery -A app.workers worker -l info --concurrency=2
```

This handles async PDF processing (text extraction, chunking, embeddings, Qdrant indexing).

---

### 5. Start the Frontend

In a **new terminal**:

```bash
cd frontend

npm install --legacy-peer-deps
npm run dev
```

Frontend runs at **http://localhost:3000**

---

### 6. Open the App

Visit **[http://localhost:3000](http://localhost:3000)**

1. Click **"Open App"** on the landing page
2. Upload a PDF (drag & drop or click upload)
3. Wait for processing to complete (status: `uploading → extracting → ready`)
4. Click on the document to open the chat interface
5. Ask questions and get AI-powered answers with page citations

---

### Verify Everything is Running

```bash
# Backend health check
curl http://localhost:8000/api/v1/health

# Should return:
# {
#   "status": "healthy",
#   "services": {
#     "postgresql": "healthy",
#     "redis": "healthy",
#     "qdrant": "healthy",
#     "openrouter": "healthy",
#     "clerk": "configured"
#   }
# }
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | **Yes** | PostgreSQL async connection string (`postgresql+asyncpg://...`) |
| `DATABASE_URL_SYNC` | **Yes** | PostgreSQL sync connection string for Alembic/Celery (`postgresql+psycopg2://...`) |
| `REDIS_URL` | **Yes** | Redis connection string (`redis://localhost:6379/0`) |
| `OPENROUTER_API_KEY` | **Yes** | OpenRouter API key for LLM + embeddings ([get one](https://openrouter.ai)) |
| `OPENROUTER_MODEL` | No | Default LLM model (fallback: `meta-llama/llama-3.1-8b-instruct`) |
| `QDRANT_URL` | **Yes** | Qdrant cluster URL ([get one](https://cloud.qdrant.io)) |
| `QDRANT_API_KEY` | **Yes** | Qdrant API key |
| `QDRANT_COLLECTION` | No | Qdrant collection name (default: `document_chunks`) |
| `CLERK_SECRET_KEY` | No | Clerk secret key — leave blank for demo mode |
| `CLERK_JWKS_URL` | No | Clerk JWKS endpoint for JWT verification |
| `CLERK_ISSUER` | No | Clerk issuer URL |
| `R2_ACCOUNT_ID` | No | Cloudflare R2 account ID — uses local filesystem if omitted |
| `R2_ACCESS_KEY_ID` | No | R2 access key |
| `R2_SECRET_ACCESS_KEY` | No | R2 secret key |
| `R2_BUCKET_NAME` | No | R2 bucket name (default: `pdfsage-uploads`) |
| `R2_ENDPOINT_URL` | No | R2 endpoint URL |
| `STRIPE_SECRET_KEY` | No | Stripe secret key for billing — leave blank to disable |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `SENTRY_DSN` | No | Sentry DSN for error tracking |
| `CORS_ORIGINS` | No | JSON array of allowed origins (default: `["http://localhost:3000"]`) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Backend API URL (default: `http://localhost:8000`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | No | Clerk publishable key — leave blank for demo mode |
| `CLERK_SECRET_KEY` | No | Clerk secret key (server-side) |

---

## Project Structure

```
pdf-sage/
├── backend/
│   ├── app/
│   │   ├── ai/                 # LangGraph pipeline, agents, LLM, retriever
│   │   │   ├── orchestrator.py #   Main RAG pipeline (SSE streaming)
│   │   │   ├── agents.py       #   Intent detection, retrieval, citation agents
│   │   │   ├── llm.py          #   OpenRouter LLM client (3-model fallback)
│   │   │   ├── retriever.py    #   Qdrant semantic search with filters
│   │   │   └── prompts.py      #   System prompts per intent
│   │   ├── api/v1/             # FastAPI route handlers
│   │   │   ├── health.py       #   Health/readiness/liveness endpoints
│   │   │   ├── documents.py    #   Upload, list, get, delete PDFs
│   │   │   ├── queries.py      #   SSE streaming Q&A endpoint
│   │   │   └── billing.py      #   Stripe billing + usage tracking
│   │   ├── core/               # Config, database, security (Clerk JWT)
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   └── workers/            # Celery tasks (PDF processing)
│   │       ├── pdf_processor.py#   Main Celery task: extract → chunk → embed → index
│   │       ├── embeddings.py   #   OpenRouter embeddings + Qdrant upsert
│   │       └── r2.py           #   Cloudflare R2 storage helpers
│   ├── alembic/                # Database migrations
│   ├── scripts/
│   │   └── entrypoint.sh       # Production startup (migrate + uvicorn)
│   ├── tests/                  # Backend test suite
│   ├── Dockerfile              # Production-grade (multi-stage, non-root)
│   ├── railway.json            # Railway deployment config (web + worker)
│   └── pyproject.toml
├── frontend/
│   ├── app/                    # Next.js App Router pages & layouts
│   │   ├── page.tsx            #   Landing page
│   │   ├── dashboard/          #   Document management dashboard
│   │   └── documents/[id]/     #   PDF viewer + AI chat interface
│   ├── components/             # React components
│   │   ├── ui/                 #   Reusable UI primitives (Button, Card, Toast, etc.)
│   │   ├── Header.tsx          #   Top navigation bar
│   │   ├── Sidebar.tsx         #   Collapsible sidebar navigation
│   │   └── ClerkProvider.tsx   #   Auth provider (optional)
│   ├── lib/                    # API client, Zustand store
│   ├── vercel.json             # Vercel deployment config
│   ├── Dockerfile              # Frontend container (alternative to Vercel)
│   └── package.json
├── docs/
│   ├── architecture/           # Design docs, product spec, roadmap
│   ├── DEPLOYMENT.md           # Production deployment guide
│   └── PRODUCTION_READINESS_REPORT.md
├── .github/workflows/
│   ├── ci.yml                  # Lint + test on PRs
│   └── deploy.yml              # Auto-deploy to Vercel + Railway on push to main
├── docker-compose.yml          # Local dev: postgres, redis, backend, worker
├── .env.example                # Root env template
├── LICENSE
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Full health check (all services) |
| `GET` | `/api/v1/health/ready` | Readiness check (critical services only) |
| `GET` | `/api/v1/health/live` | Liveness check (always 200) |
| `POST` | `/api/v1/documents/upload-url` | Get presigned R2 upload URL |
| `POST` | `/api/v1/documents` | Register document (triggers Celery processing) |
| `GET` | `/api/v1/documents` | List all documents for current user |
| `GET` | `/api/v1/documents/{id}` | Get document metadata |
| `GET` | `/api/v1/documents/{id}/pdf` | Download/stream PDF file |
| `DELETE` | `/api/v1/documents/{id}` | Delete document + vectors + file |
| `POST` | `/api/v1/query` | Ask question (SSE streaming response) |
| `GET` | `/api/v1/query/history` | Get query history (last 50) |
| `GET` | `/api/v1/billing/usage` | Get usage stats for current month |
| `POST` | `/api/v1/billing/checkout` | Create Stripe checkout session |
| `GET` | `/api/v1/billing/subscription` | Get current subscription plan |
| `POST` | `/api/v1/billing/webhook` | Stripe webhook handler |

Interactive API docs available at **http://localhost:8000/docs** (Swagger UI) and **http://localhost:8000/redoc** (ReDoc).

---

## Development

### Running Tests

```bash
cd backend
source .venv/bin/activate
pytest -v --tb=short
```

### Linting

```bash
# Backend
cd backend && ruff check app/ alembic/

# Frontend
cd frontend && npm run lint
```

### Type Checking

```bash
# Backend
cd backend && mypy app/

# Frontend (via Next.js build)
cd frontend && npm run build
```

---

## Production Deployment

The application is production-ready and configured for automatic deployment via GitHub Actions.

### Deployment Architecture

| Service | Platform | Purpose |
|---------|----------|---------|
| **Frontend** | [Vercel](https://vercel.com) | Next.js hosting with global edge network + HTTPS |
| **Backend API** | [Railway](https://railway.app) | FastAPI container with healthchecks + autoscale |
| **Celery Worker** | [Railway](https://railway.app) | Background PDF processing |
| **Database** | [Neon](https://neon.tech) | Serverless PostgreSQL with connection pooling |
| **Redis** | [Upstash](https://upstash.com) | Serverless Redis for Celery |
| **Vector DB** | [Qdrant Cloud](https://cloud.qdrant.io) | Managed Qdrant cluster |
| **File Storage** | [Cloudflare R2](https://developers.cloudflare.com/r2/) | S3-compatible object storage |
| **CI/CD** | [GitHub Actions](https://github.com/features/actions) | Auto-deploy on push to `main` |

### CI/CD Pipeline

```
git push to main
    │
    ├─► deploy-frontend  →  Vercel build + deploy
    │
    ├─► deploy-backend   →  Railway web + worker deploy
    │
    └─► health-check     →  Verify both services return HTTP 200
```

No manual deployment steps required after initial setup.

### Full Deployment Guide

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for step-by-step instructions covering:
- Infrastructure provisioning (Neon, Upstash, R2, Qdrant, Railway, Vercel)
- Environment variable configuration
- GitHub Secrets setup
- CI/CD pipeline configuration
- Post-deploy validation checklist

See **[docs/PRODUCTION_READINESS_REPORT.md](docs/PRODUCTION_READINESS_REPORT.md)** for the full audit and readiness assessment.

---

## Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) — Production setup for Vercel + Railway
- [Production Readiness Report](docs/PRODUCTION_READINESS_REPORT.md) — Audit, fixes, and validation
- [Architecture & Design](docs/architecture/design.md) — System design decisions
- [Product Specification](docs/architecture/product.md) — Feature spec and user stories
- [Roadmap](docs/architecture/roadmap.md) — Planned features and milestones

---

## License

[MIT](LICENSE) — © 2026 PDF Sage