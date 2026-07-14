"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchApi(url: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers as Record<string, string>,
      };

      const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
      });

      if (res.status === 204) return null;

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ detail: "Unknown error" }));
        const error = new Error(errorBody.detail || `API error: ${res.status}`);
        (error as any).status = res.status;
        (error as any).body = errorBody;

        // Don't retry on client errors (4xx) except 429
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          throw error;
        }

        // Retry on server errors (5xx) or rate limits (429)
        if (attempt < retries) {
          await sleep(RETRY_DELAY * attempt);
          continue;
        }

        throw error;
      }

      return res.json();
    } catch (error: any) {
      // Network errors - retry
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        if (attempt < retries) {
          await sleep(RETRY_DELAY * attempt);
          continue;
        }
      }
      throw error;
    }
  }
}

export function useApiClient() {
  return {
    getDocuments: () => fetchApi("/api/v1/documents"),
    getDocument: (docId: string) => fetchApi(`/api/v1/documents/${docId}`),
    getUploadUrl: (filename: string) =>
      fetchApi("/api/v1/documents/upload-url", {
        method: "POST",
        body: JSON.stringify({ filename, content_type: "application/pdf" }),
      }),
    createDocument: (filename: string, s3_key: string) =>
      fetchApi("/api/v1/documents", {
        method: "POST",
        body: JSON.stringify({ filename, s3_key }),
      }),
    deleteDocument: (docId: string) =>
      fetchApi(`/api/v1/documents/${docId}`, { method: "DELETE" }),
    getQueryHistory: () => fetchApi("/api/v1/query/history"),
    getUsage: () => fetchApi("/api/v1/billing/usage"),
    getSubscription: () => fetchApi("/api/v1/billing/subscription"),
    queryDocument: async (question: string, documentIds: string[], conversationId?: string) => {
      const res = await fetch(`${API_BASE}/api/v1/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          document_ids: documentIds,
          conversation_id: conversationId,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ detail: "Query failed" }));
        throw new Error(errorBody.detail || `Query failed: ${res.status}`);
      }

      return res;
    },
  };
}
