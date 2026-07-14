"use client";

import { useEffect, useState, useCallback } from "react";
import { useApiClient } from "@/lib/api-client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { DocumentCard, DropZone, EmptyState, Button, useToast, Skeleton } from "@/components/ui";
import { FileText, Upload } from "lucide-react";

interface Document {
  id: string;
  filename: string;
  page_count: number | null;
  status: string;
  processing_step: string | null;
  processing_progress: number;
  created_at: string;
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { toast } = useToast();
  const api = useApiClient();

  const loadDocuments = useCallback(async () => {
    try {
      const data = await api.getDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      toast("error", "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [toast, api]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "processing");
    if (!hasProcessing) return;
    const interval = setInterval(loadDocuments, 3000);
    return () => clearInterval(interval);
  }, [documents, loadDocuments]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const { upload_url, s3_key } = await api.getUploadUrl(file.name);

      const putRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });

      if (!putRes.ok) throw new Error("Failed to upload file");

      await api.createDocument(file.name, s3_key);
      await loadDocuments();
      toast("success", "Document uploaded successfully");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await api.deleteDocument(docId);
      await loadDocuments();
      toast("success", "Document deleted");
    } catch (err) {
      toast("error", "Failed to delete document");
    }
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--obsidian)' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onMobileToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onNewDocument={() => document.getElementById("file-upload")?.click()}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Documents"
          subtitle={`${documents.length} document${documents.length !== 1 ? "s" : ""}`}
          actions={
            <Button
              onClick={() => document.getElementById("file-upload")?.click()}
              loading={uploading}
              icon={<Upload className="w-4 h-4" />}
            >
              Upload PDF
            </Button>
          }
        />

        <main className="flex-1 overflow-y-auto p-6">
          <input
            id="file-upload"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5"
                  style={{
                    background: 'var(--obsidian-elevated)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="max-w-md mx-auto mt-8">
              <DropZone onUpload={handleUpload} />
              <EmptyState
                icon={<FileText className="w-6 h-6" style={{ color: 'var(--gallery-ghost)' }} />}
                title="No documents yet"
                description="Upload your first PDF to get started. You can drag and drop files or click the upload button."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
