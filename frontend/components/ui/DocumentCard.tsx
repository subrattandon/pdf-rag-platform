"use client";

import Link from "next/link";
import { FileText, MoreHorizontal, Trash2, MessageSquare, Clock } from "lucide-react";
import { useState } from "react";
import Badge from "./Badge";

interface Document {
  id: string;
  filename: string;
  page_count: number | null;
  status: string;
  processing_step: string | null;
  processing_progress: number;
  created_at: string;
}

interface DocumentCardProps {
  document: Document;
  onDelete?: (id: string) => void;
}

function getProcessingLabel(step: string | null): string {
  const labels: Record<string, string> = {
    uploading: "Uploading",
    extracting: "Extracting text",
    chunking: "Processing",
    embedding: "Generating embeddings",
    indexing: "Indexing",
    ready: "Complete",
  };
  return labels[step || ""] || "Processing";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="group relative rounded-2xl overflow-hidden"
      style={{
        background: 'var(--obsidian-elevated)',
        border: '1px solid rgba(255,255,255,0.06)',
        transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(129,140,248,0.15)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <Link href={`/documents/${document.id}`} className="block p-5">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--violet-soft)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <FileText className="w-5 h-5" style={{ color: 'var(--gallery-ghost)' }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3
                className="text-sm font-medium truncate"
                style={{ color: 'var(--gallery-fg)' }}
              >
                {document.filename}
              </h3>
              <Badge
                variant={
                  document.status === "ready"
                    ? "success"
                    : document.status === "processing"
                    ? "warning"
                    : "error"
                }
                dot
              >
                {document.status}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--gallery-ghost)' }}>
              {document.page_count && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {document.page_count} pages
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(document.created_at)}
              </span>
            </div>

            {document.status === "processing" && document.processing_progress > 0 && (
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'var(--gallery-ghost)' }}>
                  <span>{getProcessingLabel(document.processing_step)}</span>
                  <span>{document.processing_progress}%</span>
                </div>
                <div
                  className="w-full h-1 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${document.processing_progress}%`,
                      background: 'linear-gradient(90deg, rgba(129,140,248,0.5), rgba(139,92,246,0.7))',
                      transition: 'width 500ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100"
            style={{ transition: 'opacity 200ms ease' }}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-xl"
              style={{
                color: 'var(--gallery-ghost)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--gallery-fg)';
                e.currentTarget.style.background = 'rgba(129,140,248,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--gallery-ghost)';
                e.currentTarget.style.background = 'transparent';
              }}
              aria-label="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div
            className="absolute right-4 top-4 z-20 w-44 rounded-xl py-1"
            style={{
              background: 'var(--obsidian-elevated)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <Link
              href={`/documents/${document.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm"
              style={{
                color: 'var(--gallery-fg)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--violet-soft)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              onClick={() => setMenuOpen(false)}
            >
              <MessageSquare className="w-4 h-4" />
              Open Chat
            </Link>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(document.id);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm"
                style={{
                  color: '#f87171',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
