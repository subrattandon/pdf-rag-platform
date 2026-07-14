# PDF Sage — System Design Spec

**Date:** 2026-06-20
**Type:** Full system design, SaaS product
**Status:** Approved

---

## 1. System Overview

PDF Sage is a SaaS platform where users upload PDFs and ask questions. The system extracts content (text, tables, images via GPT-4V), generates embeddings, stores them in Weaviate, and answers queries with source references (document name, page number).

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (Vercel) |
| Backend | Python + FastAPI (Railway) |
| Workers | Celery + Redis (Railway) |
| Vector DB | Weaviate Cloud |
| Relational DB | PostgreSQL (Railway) |
| Object Storage | Cloudflare R2 (S3-compatible) |
| Auth | Clerk |
| Billing | Stripe |
| LLM | OpenAI GPT-4 / GPT-4V + text-embedding-3-large |

### Architecture

Monolith API + async Celery workers. Single FastAPI service handles API requests. Celery workers (same codebase, different entrypoint) handle heavy PDF processing off the main thread.

### Data Flow

```
Upload Flow:
User uploads PDF → presigned R2 URL (direct upload) → API creates Document record →
  Celery worker: extract text (PyMuPDF) + GPT-4V for visual content →
  chunk content (512 tokens, 50-token overlap) →
  generate embeddings (text-embedding-3-large, 3072 dims) →
  store chunks + embeddings in Weaviate →
  mark document "ready" in PostgreSQL

Query Flow:
User asks question → API generates query embedding →
  Weaviate hybrid search (70% vector + 30% BM25) → top 10 chunks →
  re-rank by relevance → assemble context →
  GPT-4 answers with [DocName, Page X] citations →
  stream response via SSE
```

---

## 2. PDF Processing Pipeline

### Steps

1. **Upload** — presigned R2 URL, direct browser-to-storage upload
2. **Job queued** — `Document` record created (status: `processing`), Celery task dispatched
3. **Text extraction** — PyMuPDF extracts text + table structures per page
4. **Visual extraction** — each page rendered as image → GPT-4V describes charts, diagrams, figures
5. **Chunking** — recursive text splitter (section headers → paragraphs → sentences). 512 tokens per chunk, 50-token overlap
6. **Embedding** — each chunk → `text-embedding-3-large` (3072 dimensions)
7. **Storage** — chunks + embeddings → Weaviate with metadata: `doc_id`, `page_number`, `chunk_index`, `content_type` (text/table/visual)
8. **Complete** — document status → `ready`, user notified via WebSocket

### Limits by Tier

| Tier | PDFs | Max Pages/PDF |
|------|------|--------------|
| Free | 5 | 50 |
| Pro | 100 | 500 |
| Enterprise | Unlimited | Unlimited |

### Error Handling

- Corrupt PDF → mark `failed`, notify user, refund processing credit
- GPT-4V timeout → retry 2x, fall back to text-only for that page
- Partial failure → process what works, flag failed pages in UI

---

## 3. Query Engine

### Flow

1. User submits question + selects PDFs to search (or "all")
2. Query → `text-embedding-3-large` → query vector
3. Weaviate hybrid search: 70% vector similarity + 30% BM25 keyword match
4. Top 10 chunks retrieved, re-ranked by relevance score
5. Chunks assembled into context window with metadata
6. GPT-4 system prompt:

```
You are a PDF document assistant. Answer based ONLY on the provided context.
For every claim, cite the source as [DocName, Page X].
If the answer isn't in the context, say so explicitly.
```

7. Response streamed via SSE

### Features

- **Multi-PDF queries** — search across all docs or selected subset
- **Conversation memory** — last 5 Q&A pairs for follow-up context
- **Source highlighting** — frontend highlights exact chunk in PDF viewer
- **Confidence indicator** — warn "low confidence" if top chunk similarity < 0.7

### Latency Targets

| Step | Target |
|------|--------|
| Embedding generation | ~100ms |
| Weaviate search | ~50ms |
| GPT-4 first token | ~300ms |
| Total time to first token | < 500ms |

---

## 4. API Design

**Base URL:** `/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/upload-url` | Get presigned R2 upload URL |
| POST | `/documents` | Register uploaded doc, start processing |
| GET | `/documents` | List user's documents |
| GET | `/documents/{id}` | Document details + processing status |
| DELETE | `/documents/{id}` | Delete doc + chunks + embeddings |
| POST | `/query` | Ask question (SSE stream response) |
| GET | `/query/history` | Past queries + answers |
| GET | `/billing/usage` | Current usage stats |
| POST | `/billing/checkout` | Create Stripe checkout session |
| GET | `/billing/subscription` | Current plan details |

### Auth

All endpoints require Clerk JWT in `Authorization: Bearer` header. Middleware validates and extracts `user_id`.

### Multi-tenancy

Every DB query and Weaviate filter scoped by `user_id`. No cross-tenant data leakage.

### Rate Limiting

Token bucket per user:

| Tier | Requests/min |
|------|-------------|
| Free | 20 |
| Pro | 100 |
| Enterprise | 500 |

### WebSocket

`/ws/documents/{id}/status` — real-time processing progress updates.

---

## 5. Database Schema (PostgreSQL)

```sql
-- Users (synced from Clerk via webhooks)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR UNIQUE NOT NULL,
    email VARCHAR NOT NULL,
    plan VARCHAR NOT NULL DEFAULT 'free', -- free, pro, enterprise
    stripe_customer_id VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR NOT NULL,
    s3_key VARCHAR NOT NULL,
    page_count INT,
    status VARCHAR NOT NULL DEFAULT 'uploading', -- uploading, processing, ready, failed
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Queries
CREATE TABLE queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_ids UUID[] NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sources JSONB NOT NULL, -- [{doc_id, page, chunk_text, score}]
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Usage tracking
CREATE TABLE usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    pdf_uploads INT DEFAULT 0,
    pages_processed INT DEFAULT 0,
    queries_made INT DEFAULT 0,
    tokens_used INT DEFAULT 0,
    UNIQUE(user_id, month)
);
```

---

## 6. Frontend (Next.js)

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page + pricing |
| `/dashboard` | Document list, upload, usage stats |
| `/documents/{id}` | PDF viewer + chat interface (split view) |
| `/billing` | Plan management, invoices |
| `/login`, `/signup` | Clerk auth components |

### Key UI

- Drag-and-drop PDF upload with progress bar
- Split view: PDF on left (react-pdf), chat on right
- Click source reference → PDF scrolls to exact page
- Real-time processing status via WebSocket
- Responsive — works on tablet, degrades gracefully on mobile

### State Management

- **React Query** — server state (documents, queries, billing)
- **Zustand** — UI state (selected doc, chat history, viewer position)

---

## 7. Infrastructure & Deployment

| Service | Platform | Rationale |
|---------|----------|-----------|
| Next.js frontend | Vercel | Native Next.js support, edge CDN, auto-deploys |
| FastAPI backend | Railway | Easy Python deploys, auto-scaling, built-in logs |
| Celery workers | Railway (separate service) | Same codebase, different entrypoint |
| Redis | Railway (addon) | Celery broker + rate limit store + WebSocket pub/sub |
| PostgreSQL | Railway (addon) | Managed, auto-backups |
| Weaviate | Weaviate Cloud | Managed vector DB, no ops burden |
| PDF storage | Cloudflare R2 | S3-compatible, zero egress fees |

### CI/CD

GitHub Actions:
- PR → lint + type-check + tests
- Merge to `main` → auto-deploy backend (Railway) + frontend (Vercel)

### Monitoring

- Sentry for error tracking (frontend + backend)
- Railway built-in metrics for CPU/memory
- Custom `/health` endpoint for uptime monitoring

### Environments

`staging` + `production` branches with separate Railway/Vercel environments.

---

## 8. Security

- All traffic HTTPS
- Clerk handles auth, session management, JWT rotation
- R2 presigned URLs expire after 15 minutes
- Weaviate queries always filtered by `user_id` — enforced at service layer, not just API layer
- PDF uploads validated via magic bytes (not just extension)
- Rate limiting prevents abuse
- Stripe webhooks verified via signature
- No raw PDF content stored in PostgreSQL — only metadata
- CORS locked to frontend domain

---

## 9. Testing Strategy

| Type | Tool | Scope |
|------|------|-------|
| Unit | Pytest | Chunking logic, embedding pipeline, query construction |
| Integration | Pytest | Full flow: upload → process → query → answer |
| API | httpx + TestClient | FastAPI endpoint testing |
| Frontend components | Vitest + React Testing Library | Component behavior |
| E2E | Playwright | Full user flows |
| Load | Locust | Concurrent query benchmarking |

---

## 10. Sub-project Decomposition

This system should be built in this order:

1. **Backend core** — FastAPI skeleton, DB models, auth middleware, health endpoint
2. **PDF pipeline** — Upload flow, PyMuPDF extraction, GPT-4V integration, chunking, embedding, Weaviate storage
3. **Query engine** — Hybrid search, GPT-4 answering, SSE streaming, conversation memory
4. **Frontend** — Next.js app, dashboard, PDF viewer + chat UI, upload flow
5. **Billing** — Stripe integration, usage tracking, tier enforcement
6. **Infrastructure** — CI/CD, monitoring, staging/prod environments
7. **Polish** — Load testing, performance optimization, error edge cases
