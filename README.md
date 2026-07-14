# PDF Sage

AI-powered document intelligence platform. Upload PDFs and have natural conversations about their content — ask questions, get summaries, translations, and code examples, all grounded in your actual documents.

![License: MIT](https://img.shields.io/badge/License-MIT-blueviolet)
![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB)
![Next.js 14](https://img.shields.io/badge/Next.js-14-000000)

---

## Features

- **Conversational AI** — Ask questions about your PDFs in natural language, get accurate answers with source citations
- **Multi-document chat** — Query across multiple documents in a single conversation
- **Smart routing** — Intent detection automatically chooses the right agent (summary, analysis, translation, code, Q&A)
- **Multilingual** — Detects and responds in Hindi, Hinglish, Tamil, Telugu, Bengali, and more
- **Real-time streaming** — SSE-based streaming for instant, token-by-token responses
- **PDF viewer** — Built-in viewer with zoom, page navigation, thumbnails, and keyboard shortcuts
- **Document management** — Upload, organize, search, and delete documents
- **Usage tracking** — Monitor queries, storage, and plan limits
- **Responsive design** — Works on desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS, Zustand |
| **Backend** | Python 3.11, FastAPI, LangGraph, Celery |
| **Database** | PostgreSQL 16 (async), Qdrant (vectors) |
| **Auth** | Clerk (JWT-based) |
| **Storage** | Cloudflare R2 or local filesystem |
| **AI** | OpenRouter (Llama 3.1, GPT-4, Claude, Gemini) |
| **Infrastructure** | Docker, Docker Compose |

## Quick Start

### Prerequisites

- Docker + Docker Compose
- Python 3.11+
- Node.js 20+
- npm or pnpm

### 1. Clone & configure

```bash
git clone https://github.com/your-org/pdf-sage.git
cd pdf-sage

# Create env files
cp .env.example .env
cp backend/.env.example backend/.env
```

### 2. Start infrastructure

```bash
docker-compose up -d postgres redis
```

This starts PostgreSQL (port 5433) and Redis (port 6379).

### 3. Set up the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e . --legacy-peer-deps
alembic upgrade head
uvicorn app.main:app --reload
```

Backend runs at [http://localhost:8000](http://localhost:8000).

### 4. Set up the frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Frontend runs at [http://localhost:3000](http://localhost:3000).

### 5. Open in browser

Visit [http://localhost:3000](http://localhost:3000) and sign in with the demo account (no setup needed for local development).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (async) |
| `REDIS_URL` | Yes | Redis connection string |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key from dashboard |
| `CLERK_JWKS_URL` | Yes | Clerk JWKS endpoint for JWT verification |
| `CLERK_ISSUER` | Yes | Clerk issuer URL |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for LLM |
| `OPENROUTER_MODEL` | No | Default model (fallback: `meta-llama/llama-3.1-8b-instruct`) |
| `QDRANT_URL` | Yes | Qdrant cluster URL |
| `QDRANT_API_KEY` | Yes | Qdrant API key |
| `R2_ACCOUNT_ID` | No | Cloudflare R2 account ID (uses local storage if omitted) |
| `R2_ACCESS_KEY_ID` | No | R2 access key |
| `R2_SECRET_ACCESS_KEY` | No | R2 secret key |
| `R2_BUCKET_NAME` | No | R2 bucket name |
| `STRIPE_SECRET_KEY` | No | Stripe secret key for billing |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `SENTRY_DSN` | No | Sentry DSN for error tracking |
| `CORS_ORIGINS` | No | Allowed origins (default: `["http://localhost:3000"]`) |

## Project Structure

```
pdf-sage/
├── backend/
│   ├── app/
│   │   ├── api/v1/           # API route handlers
│   │   ├── core/             # Config, database, security
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business logic (storage, usage)
│   │   └── workers/          # Celery tasks (PDF processing)
│   ├── alembic/              # DB migrations
│   ├── tests/                # Backend tests
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── app/                  # Next.js pages & layouts
│   ├── components/           # React components
│   │   └── ui/               # Reusable UI primitives
│   ├── lib/                  # API client, store
│   └── package.json
├── docs/
│   ├── architecture/         # Design docs, product spec, roadmap
├── .github/workflows/        # CI/CD configuration
├── docker-compose.yml
├── LICENSE
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/documents/upload-url` | Get presigned upload URL |
| POST | `/api/v1/documents` | Register document |
| GET | `/api/v1/documents` | List documents |
| GET | `/api/v1/documents/{id}` | Get document |
| GET | `/api/v1/documents/{id}/pdf` | Download PDF |
| DELETE | `/api/v1/documents/{id}` | Delete document |
| POST | `/api/v1/query` | Ask question (SSE streaming) |
| GET | `/api/v1/query/history` | Query history |
| GET | `/api/v1/billing/usage` | Usage stats |
| POST | `/api/v1/billing/checkout` | Stripe checkout |
| GET | `/api/v1/billing/subscription` | Current plan |

## Documentation

- [Architecture & Design](docs/architecture/design.md)
- [Product Specification](docs/architecture/product.md)
- [Roadmap](docs/architecture/roadmap.md)

## License

[MIT](LICENSE)
