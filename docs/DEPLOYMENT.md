# PDF Sage — Production Deployment Guide

**Goal:** After following this guide, anyone can open ONE public URL and use the
application immediately — no Docker, no manual frontend/backend startup.

---

## Architecture Overview (2026 best practices)

| Layer            | Service              | Why                                     |
|------------------|----------------------|-----------------------------------------|
| Frontend         | Vercel               | Next.js native, global edge, auto HTTPS |
| Backend (API)    | Railway (web)        | Docker-based, healthchecks, autosleep   |
| Backend (worker) | Railway (worker)     | Celery worker for PDF processing         |
| Database         | Neon PostgreSQL      | Serverless Postgres, pooled, branching  |
| Redis            | Upstash Redis        | Serverless, Celery broker/backend       |
| Vector DB        | Qdrant Cloud         | Managed, existing cluster               |
| File storage     | Cloudflare R2        | S3-compatible, presigned URLs           |
| CI/CD            | GitHub Actions       | Auto-deploy on push to main             |

```
            ┌──────────────────────────────────────────────┐
            │                  User (browser)                │
            └────────────────────┬───────────────────────────┘
                                 │  https://pdf-sage.vercel.app
                                 ▼
                       ┌──────────────────┐
                       │  Vercel (Next.js) │  ← frontend, SSR/static
                       └────────┬─────────┘
                                │  NEXT_PUBLIC_API_URL
                                ▼
              ┌──────────────────────────────────┐
              │  Railway — web (FastAPI/uvicorn)  │  ← /api/v1/*
              └───┬───────┬───────┬───────┬───────┘
                  │       │       │       │
        ┌─────────┘       │       │       └──────────────┐
        ▼                 ▼       ▼                      ▼
  ┌───────────┐   ┌───────────┐ ┌──────────┐    ┌──────────────┐
  │ Neon PG   │   │ Upstash   │ │ Qdrant   │    │ OpenRouter   │
  │ (async)   │   │ Redis     │ │ Cloud    │    │ (LLM+embed)  │
  └───────────┘   └─────┬─────┘ └──────────┘    └──────────────┘
                        │
                        ▼
              ┌──────────────────────────┐
              │ Railway — worker (Celery) │  ← PDF processing
              └────────────┬─────────────┘
                           │
              ┌────────────▼────────────┐
              │ Cloudflare R2 (uploads) │
              └─────────────────────────┘
```

---

## STEP 1 — Provision Infrastructure

### 1.1 Neon PostgreSQL
1. Sign up at https://neon.tech
2. Create a new project → `pdf-sage`
3. Copy two connection strings:
   - **Pooled** (for app): `postgresql+asyncpg://...?sslmode=require`
   - **Direct** (for migrations): `postgresql+psycopg2://...?sslmode=require`
4. Set the sync variant for `DATABASE_URL_SYNC`:
   `postgresql+psycopg2://USER:PASS@ep-xxx.REGION.aws.neon.tech/pdfsage?sslmode=require`

### 1.2 Upstash Redis
1. Sign up at https://upstash.com
2. Create a Redis DB → region closest to Railway
3. Copy the **`rediss://`** connection string (TLS endpoint)

### 1.3 Qdrant Cloud
1. Use your existing Qdrant cluster (or create one at https://cloud.qdrant.io)
2. Note the cluster URL and API key

### 1.4 Cloudflare R2
1. Dashboard → R2 → Create bucket → `pdfsage-uploads`
2. Settings → API Tokens → Create token with Object Read & Write
3. Note: Account ID, Access Key ID, Secret Access Key, Endpoint URL
   (`https://<account-id>.r2.cloudflarestorage.com`)

### 1.5 OpenRouter
1. https://openrouter.ai → API Keys → create a key
2. Note the API key (`sk-or-v1-...`)

### 1.6 Clerk (optional — leave blank for demo mode)
1. https://clerk.com → Create application
2. Get: Publishable Key, Secret Key, JWKS URL, Issuer
3. **If left blank:** the app runs in demo mode with a single demo user.
   This is the current working state and is sufficient to test all features.

---

## STEP 2 — Deploy Backend to Railway

### 2.1 Create Railway project
1. Sign up at https://railway.app
2. New Project → Deploy from GitHub repo → select `pdf-rag-platform`
3. Railway will detect `backend/railway.json` and create two services:
   - `web`  (FastAPI)
   - `worker` (Celery)

### 2.2 Set backend environment variables
In Railway, for **both** `web` and `worker` services, set these variables
(copy from `backend/.env.production.example`):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql+asyncpg://...@ep-xxx-pooler...neon.tech/pdfsage?sslmode=require` |
| `DATABASE_URL_SYNC` | `postgresql+psycopg2://...@ep-xxx...neon.tech/pdfsage?sslmode=require` |
| `REDIS_URL` | `rediss://default:...@xxx.upstash.io:6379` |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | `meta-llama/llama-3.1-8b-instruct` |
| `QDRANT_URL` | `https://your-cluster.qdrant.io` |
| `QDRANT_API_KEY` | `your_qdrant_api_key` |
| `R2_ACCOUNT_ID` | `...` |
| `R2_ACCESS_KEY_ID` | `...` |
| `R2_SECRET_ACCESS_KEY` | `...` |
| `R2_BUCKET_NAME` | `pdfsage-uploads` |
| `R2_ENDPOINT_URL` | `https://<id>.r2.cloudflarestorage.com` |
| `CORS_ORIGINS` | `["https://pdf-sage.vercel.app"]` *(update after Vercel deploy)* |
| `CLERK_SECRET_KEY` | *(blank for demo mode)* |
| `CLERK_JWKS_URL` | *(blank for demo mode)* |
| `CLERK_ISSUER` | *(blank for demo mode)* |
| `STRIPE_SECRET_KEY` | *(blank to disable billing)* |
| `SENTRY_DSN` | *(optional)* |
| `DEBUG` | `false` |
| `PORT` | `8000` |
| `WEB_CONCURRENCY` | `1` |

### 2.3 Generate backend domain
1. Railway → `web` service → Settings → Networking → Generate Domain
2. Note the URL, e.g. `https://pdf-sage-backend.up.railway.app`
3. Update `CORS_ORIGINS` on both services with this URL pattern if needed
   (the backend must allow the Vercel frontend origin).

### 2.4 Verify backend
```
curl https://pdf-sage-backend.up.railway.app/api/v1/health/live
# → {"status":"alive"}

curl https://pdf-sage-backend.up.railway.app/api/v1/health
# → {"status":"healthy","services":{...}}
```

---

## STEP 3 — Deploy Frontend to Vercel

### 3.1 Create Vercel project
1. Sign up at https://vercel.com
2. New Project → Import from GitHub → select `pdf-rag-platform`
3. **Root Directory:** `frontend`
4. Framework preset: **Next.js** (auto-detected)
5. `vercel.json` will be picked up automatically.

### 3.2 Set frontend environment variables
Vercel → Project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://pdf-sage-backend.up.railway.app` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | *(blank for demo mode)* |
| `CLERK_SECRET_KEY` | *(blank for demo mode)* |

### 3.3 Deploy
1. Click **Deploy**
2. Note the URL, e.g. `https://pdf-sage.vercel.app`

### 3.4 Loop-back: update CORS
Go back to Railway → both services → update `CORS_ORIGINS` to:
```
["https://pdf-sage.vercel.app"]
```
Redeploy the Railway `web` service.

---

## STEP 4 — Configure GitHub Secrets for CI/CD

Repository → Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel personal access token (vercel.com → Account → Tokens) |
| `VERCEL_ORG_ID` | Vercel team/org ID (`.vercel/project.json` or CLI) |
| `VERCEL_PROJECT_ID` | Vercel project ID (`.vercel/project.json` or CLI) |
| `RAILWAY_TOKEN` | Railway account token (railway.app → Account → Tokens) |
| `RAILWAY_PROJECT_ID` | Railway project ID (project settings) |
| `NEXT_PUBLIC_API_URL` | `https://pdf-sage-backend.up.railway.app` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (or blank) |
| `BACKEND_URL` | `https://pdf-sage-backend.up.railway.app` (for health checks) |
| `FRONTEND_URL` | `https://pdf-sage.vercel.app` (for health checks) |

---

## STEP 5 — CI/CD Flow (automatic)

After all secrets are set, every `git push origin main` triggers:

```
push to main
    │
    ├─► deploy-frontend job
    │     vercel pull → vercel build → vercel deploy --prod
    │
    ├─► deploy-backend job
    │     railway up --service web
    │     railway up --service worker
    │
    └─► health-check job (waits for both to be live)
          curl BACKEND_URL/api/v1/health/live  → 200
          curl FRONTEND_URL                    → 200
```

No manual steps required after initial setup.

---

## STEP 6 — Post-Deploy Validation Checklist

Open `https://pdf-sage.vercel.app` and verify each item:

- [ ] **Landing page loads** — hero, features, FAQ render
- [ ] **Login works** — click "Open App", dashboard loads (demo mode auto-logs in)
- [ ] **Upload PDF works** — drag a PDF into the drop zone, upload completes
- [ ] **PDF processing works** — status changes uploading → extracting → ready
- [ ] **Embeddings generated** — check Railway worker logs for embedding timings
- [ ] **Qdrant search works** — `curl BACKEND/api/v1/health` shows qdrant: healthy
- [ ] **AI answers correctly** — open a document, ask a question, get an answer
- [ ] **Citations work** — answer shows "Page X" source badges
- [ ] **Streaming works** — answer appears token-by-token (SSE)
- [ ] **Mobile responsive** — resize to mobile width, layout adapts
- [ ] **HTTPS enabled** — both Vercel and Railway auto-provision TLS
- [ ] **Health endpoint** — `https://BACKEND/api/v1/health` returns `healthy`

---

## Files Changed for Production Readiness

| File | Purpose |
|------|---------|
| `backend/alembic/env.py` | Read `DATABASE_URL` from env (was hardcoded in `alembic.ini`) |
| `backend/alembic/versions/002_schema_fixes_and_seed.py` | Add missing columns + seed demo user |
| `backend/Dockerfile` | Production image: non-root, healthcheck, proxy-headers, entrypoint |
| `backend/scripts/entrypoint.sh` | Run migrations (with retry) then start uvicorn |
| `backend/railway.json` | Define `web` + `worker` services for Railway |
| `backend/.env.production.example` | Template for all backend prod env vars |
| `frontend/vercel.json` | Vercel build + security headers config |
| `frontend/.env.production.example` | Template for frontend prod env vars |
| `.env.example` | Updated root env template (complete) |
| `.github/workflows/deploy.yml` | Auto-deploy pipeline (Vercel + Railway + healthcheck) |
| `.github/workflows/ci.yml` | Added missing build env var |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Backend health `degraded` | Check Railway logs; verify `DATABASE_URL`, `REDIS_URL` |
| Upload fails (PUT 403/404) | R2 keys wrong; or CORS not updated to Vercel domain |
| Query returns 503 "AI not configured" | `OPENROUTER_API_KEY` missing on Railway `web` service |
| Query returns 503 "Vector DB not configured" | `QDRANT_URL` / `QDRANT_API_KEY` missing |
| PDF stuck in `processing` | Railway `worker` not running; check `REDIS_URL` on worker |
| CORS error in browser | `CORS_ORIGINS` on backend doesn't include Vercel domain |
| Migration fails on deploy | `DATABASE_URL_SYNC` missing or wrong driver (`psycopg2`) |
| `ForeignKeyViolation` on upload | Demo user not seeded; migration 002 didn't run |