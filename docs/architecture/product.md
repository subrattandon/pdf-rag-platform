# PDF Sage

AI-powered SaaS platform for asking questions about PDF documents.

## Product Overview

PDF Sage enables users to upload PDF documents and interact with them through natural language queries. The AI analyzes document content and provides accurate answers with exact page citations.

## Target Users

- **Primary:** Knowledge workers who regularly review lengthy PDFs (researchers, analysts, legal professionals)
- **Secondary:** Teams needing to extract insights from shared document libraries

## Core Features

1. **Document Upload & Processing** - Upload PDFs with automatic text extraction and indexing
2. **Natural Language Q&A** - Ask questions in plain English, get answers with source citations
3. **Cross-Document Search** - Search across entire document library
4. **Document Management** - Organize, view, and delete documents

## Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS, Framer Motion, Zustand
- **Backend:** Python, FastAPI, Celery
- **Database:** PostgreSQL, Weaviate (vector)
- **Storage:** Cloudflare R2
- **AI:** OpenAI GPT-4, text-embedding-3-large
- **Auth:** Clerk
- **Billing:** Stripe

## Key Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page - marketing, features, FAQ |
| `/dashboard` | Document management, upload, list |
| `/documents/[id]` | Document viewer with chat interface |

## Design Principles

- **Minimal & Clean** - Reduce cognitive load, focus on content
- **Fast & Responsive** - Optimistic updates, skeleton loading
- **Professional** - Enterprise-ready aesthetic, trust signals
- **Accessible** - Keyboard navigation, screen reader support

## Brand Voice

- Confident but not arrogant
- Technical but approachable
- Clear, concise copy
- No jargon unless targeting technical users
