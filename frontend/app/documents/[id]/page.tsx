"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  FileText,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
  Columns2,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChatMessage,
  ChatInput,
  TypingIndicator,
  Badge,
  Button,
  Skeleton,
  useToast,
} from "@/components/ui";
import { useApiClient } from "@/lib/api-client";

interface Source {
  doc_id: string;
  page: number;
  chunk_text: string;
  score: number;
}

interface ChatMessageData {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  intent?: string;
  timestamp: Date;
}

interface DocumentInfo {
  id: string;
  filename: string;
  page_count: number | null;
  status: string;
}

const QUICK_ACTIONS = [
  "Summarize this document",
  "What are the key points?",
  "Explain the main concepts",
  "Extract all important data",
];

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [docInfo, setDocInfo] = useState<DocumentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState<"width" | "page">("width");
  const [queryStatus, setQueryStatus] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [highlightedPages, setHighlightedPages] = useState<Set<number>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const api = useApiClient();
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (docInfo) {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      setPdfUrl(`${API_BASE}/api/v1/documents/${id}/pdf`);
    }
  }, [docInfo, id]);

  useEffect(() => {
    async function fetchDoc() {
      try {
        const data = await api.getDocument(id);
        setDocInfo(data);
      } catch {
        toast("error", "Failed to load document");
      } finally {
        setLoading(false);
      }
    }
    fetchDoc();
  }, [id, toast, api]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, queryStatus]);

  useEffect(() => {
    const pages = new Set<number>();
    messages.forEach((msg) => {
      if (msg.role === "assistant" && msg.sources) {
        msg.sources.forEach((src) => {
          if (src.page) pages.add(src.page);
        });
      }
      if (msg.role === "assistant" && msg.content) {
        const matches = msg.content.match(/\[Page(?:s)?\s+(\d+(?:\s*,\s*\d+)*)\]/g);
        if (matches) {
          matches.forEach((m) => {
            const nums = m.match(/\d+/g);
            nums?.forEach((n) => pages.add(parseInt(n)));
          });
        }
      }
    });
    setHighlightedPages(pages);
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (!totalPages) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          setCurrentPage((p) => Math.max(1, p - 1));
          break;
        case "ArrowRight":
          e.preventDefault();
          setCurrentPage((p) => Math.min(totalPages, p + 1));
          break;
        case "PageUp":
          e.preventDefault();
          setCurrentPage((p) => Math.max(1, p - 1));
          break;
        case "PageDown":
          e.preventDefault();
          setCurrentPage((p) => Math.min(totalPages, p + 1));
          break;
        case "Home":
          e.preventDefault();
          setCurrentPage(1);
          break;
        case "End":
          e.preventDefault();
          setCurrentPage(totalPages);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalPages]);

  async function handleSend(message: string) {
    if (streaming) return;

    const userMessage: ChatMessageData = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setStreaming(true);
    setQueryStatus("Analyzing your question...");

    const activeConversationId =
      conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!conversationId) {
      setConversationId(activeConversationId);
    }

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const headers: Record<string, string> = { "Content-Type": "application/json" };

      const res = await fetch(`${API_BASE}/api/v1/query`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          question: message,
          document_ids: [id],
          conversation_id: activeConversationId,
        }),
      });

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Failed to get answer. Please try again.",
            timestamp: new Date(),
          },
        ]);
        setQueryStatus("");
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let sources: Source[] = [];
      let intent = "";
      let sseBuffer = "";
      let hasStartedContent = false;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", timestamp: new Date() },
      ]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "content") {
                if (!hasStartedContent) {
                  hasStartedContent = true;
                  setQueryStatus("");
                }
                assistantContent += data.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                    intent,
                    timestamp: new Date(),
                  };
                  return updated;
                });
              } else if (data.type === "sources") {
                sources = data.sources;
              } else if (data.type === "intent") {
                intent = data.intent;
              } else if (data.type === "status") {
                setQueryStatus(data.status);
              }
            } catch {
              // SSE parse errors are expected
            }
          }
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: assistantContent,
          sources,
          intent,
          timestamp: new Date(),
        };
        return updated;
      });
      setQueryStatus("");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Could not connect to API. Make sure backend is running.",
          timestamp: new Date(),
        },
      ]);
      setQueryStatus("");
    } finally {
      setStreaming(false);
    }
  }

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setQueryStatus("");
    setHighlightedPages(new Set());
  };

  const toolbarBtnStyle = {
    color: 'var(--gallery-ghost)',
    transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
  };

  const toolbarBtnHover = (e: React.MouseEvent<HTMLElement>, active = false) => {
    if (active) return;
    const el = e.currentTarget as HTMLElement;
    el.style.color = 'var(--gallery-fg)';
    el.style.background = 'rgba(129,140,248,0.08)';
  };

  const toolbarBtnLeave = (e: React.MouseEvent<HTMLElement>, active = false) => {
    if (active) return;
    const el = e.currentTarget as HTMLElement;
    el.style.color = 'var(--gallery-ghost)';
    el.style.background = 'transparent';
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--obsidian)' }}>
      {/* Left Panel - PDF Viewer */}
      <div
        className="flex flex-col flex-shrink-0"
        style={{
          width: isFullscreen ? "100%" : "55%",
          background: 'var(--obsidian-surface)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Toolbar */}
        <div
          className="h-12 flex items-center justify-between px-3 flex-shrink-0"
          style={{
            background: 'var(--nav-bg)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg"
              style={toolbarBtnStyle}
              onMouseEnter={toolbarBtnHover}
              onMouseLeave={toolbarBtnLeave}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className="p-1.5 rounded-lg"
              style={{
                ...toolbarBtnStyle,
                color: showThumbnails ? 'var(--gallery-fg)' : 'var(--gallery-ghost)',
                background: showThumbnails ? 'rgba(129,140,248,0.08)' : 'transparent',
              }}
              onMouseEnter={(e) => toolbarBtnHover(e, showThumbnails)}
              onMouseLeave={(e) => toolbarBtnLeave(e, showThumbnails)}
              title="Toggle thumbnails"
            >
              {showThumbnails ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>
            <div className="flex items-center gap-1.5 ml-1">
              <FileText className="w-3.5 h-3.5" style={{ color: 'var(--gallery-ghost)' }} />
              <span
                className="text-xs font-medium truncate max-w-[180px]"
                style={{ color: 'var(--gallery-muted)' }}
              >
                {docInfo?.filename || "Loading..."}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(30, z - 15))}
              className="p-1.5 rounded-lg"
              style={toolbarBtnStyle}
              onMouseEnter={toolbarBtnHover}
              onMouseLeave={toolbarBtnLeave}
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="px-2 py-1 rounded-lg text-xs font-medium min-w-[48px] text-center"
              style={{
                ...toolbarBtnStyle,
                color: 'var(--gallery-muted)',
              }}
              onMouseEnter={toolbarBtnHover}
              onMouseLeave={toolbarBtnLeave}
              title="Reset zoom"
            >
              {zoom}%
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(300, z + 15))}
              className="p-1.5 rounded-lg"
              style={toolbarBtnStyle}
              onMouseEnter={toolbarBtnHover}
              onMouseLeave={toolbarBtnLeave}
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-4 w-px mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />

            <button
              onClick={() => setFitMode("width")}
              className="px-2 py-1 rounded-lg text-xs font-medium"
              style={{
                ...toolbarBtnStyle,
                color: fitMode === "width" ? 'var(--gallery-fg)' : 'var(--gallery-ghost)',
                background: fitMode === "width" ? 'rgba(129,140,248,0.08)' : 'transparent',
              }}
              onMouseEnter={(e) => toolbarBtnHover(e, fitMode === "width")}
              onMouseLeave={(e) => toolbarBtnLeave(e, fitMode === "width")}
              title="Fit width"
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFitMode("page")}
              className="px-2 py-1 rounded-lg text-xs font-medium"
              style={{
                ...toolbarBtnStyle,
                color: fitMode === "page" ? 'var(--gallery-fg)' : 'var(--gallery-ghost)',
                background: fitMode === "page" ? 'rgba(129,140,248,0.08)' : 'transparent',
              }}
              onMouseEnter={(e) => toolbarBtnHover(e, fitMode === "page")}
              onMouseLeave={(e) => toolbarBtnLeave(e, fitMode === "page")}
              title="Fit page"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  ...toolbarBtnStyle,
                  color: currentPage <= 1 ? 'rgba(148,163,184,0.2)' : 'var(--gallery-ghost)',
                }}
                onMouseEnter={toolbarBtnHover}
                onMouseLeave={toolbarBtnLeave}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <div className="flex items-center gap-1 text-xs">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const p = parseInt(e.target.value);
                    if (p >= 1 && p <= totalPages) setCurrentPage(p);
                  }}
                  className="w-8 text-center text-xs font-medium rounded-md py-0.5"
                  style={{
                    color: 'var(--gallery-fg)',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    outline: 'none',
                  }}
                />
                <span style={{ color: 'var(--gallery-ghost)' }}>/</span>
                <span className="font-medium" style={{ color: 'var(--gallery-ghost)' }}>
                  {totalPages || "—"}
                </span>
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  ...toolbarBtnStyle,
                  color: currentPage >= totalPages ? 'rgba(148,163,184,0.2)' : 'var(--gallery-ghost)',
                }}
                onMouseEnter={toolbarBtnHover}
                onMouseLeave={toolbarBtnLeave}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-4 w-px mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />

            <button
              onClick={() => {
                if (pdfUrl) {
                  const a = document.createElement("a");
                  a.href = pdfUrl;
                  a.download = docInfo?.filename || "document.pdf";
                  a.click();
                }
              }}
              className="p-1.5 rounded-lg"
              style={toolbarBtnStyle}
              onMouseEnter={toolbarBtnHover}
              onMouseLeave={toolbarBtnLeave}
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                  setIsFullscreen(true);
                } else {
                  document.exitFullscreen();
                  setIsFullscreen(false);
                }
              }}
              className="p-1.5 rounded-lg"
              style={toolbarBtnStyle}
              onMouseEnter={toolbarBtnHover}
              onMouseLeave={toolbarBtnLeave}
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Thumbnail Sidebar */}
          <AnimatePresence>
            {showThumbnails && totalPages > 0 && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 72, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="border-r border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)] overflow-y-auto overflow-x-hidden flex-shrink-0"
              >
                <div className="p-2 space-y-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <PdfThumbnail
                      key={pageNum}
                      pdfUrl={pdfUrl}
                      pageNumber={pageNum}
                      isActive={currentPage === pageNum}
                      isHighlighted={highlightedPages.has(pageNum)}
                      onClick={() => setCurrentPage(pageNum)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main PDF Viewer */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-20 bg-[rgba(255,255,255,0.04)] rounded-lg mx-auto animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 bg-[rgba(255,255,255,0.04)] rounded w-32 mx-auto animate-pulse" />
                  <div className="h-2 bg-[rgba(255,255,255,0.04)] rounded w-24 mx-auto animate-pulse" />
                </div>
              </div>
            </div>
          ) : !pdfUrl ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <FileText className="w-12 h-12 text-[rgba(148,163,184,0.2)] mx-auto" />
                <p className="text-sm text-[rgba(148,163,184,0.32)]">PDF not available</p>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <PdfViewerEmbed
                pdfUrl={pdfUrl}
                filename={docInfo?.filename || "document.pdf"}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onTotalPagesChange={setTotalPages}
                highlightedPages={highlightedPages}
                zoom={zoom}
                fitMode={fitMode}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div className="flex flex-col flex-1 min-w-0" style={{ background: 'var(--obsidian)' }}>
        {/* Chat Header */}
        <div
          className="h-12 flex items-center justify-between px-4 flex-shrink-0"
          style={{
            background: 'var(--obsidian)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{
                background: 'var(--violet-soft)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span className="text-[10px] font-bold" style={{ color: 'var(--violet-light)' }}>AI</span>
            </div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--gallery-fg)' }}>Assistant</h2>
            {docInfo?.status === "ready" && (
              <Badge variant="success" size="sm" dot>
                Ready
              </Badge>
            )}
            {docInfo?.status === "processing" && (
              <Badge variant="warning" size="sm" dot>
                Processing
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {highlightedPages.size > 0 && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  color: 'var(--gallery-ghost)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {highlightedPages.size} cited page{highlightedPages.size > 1 ? "s" : ""}
              </span>
            )}
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleNewConversation}>
                New Chat
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: 'var(--violet-soft)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.06)',
                }}
              >
                <span className="text-2xl">💬</span>
              </div>
              <h3
                className="text-lg font-semibold mb-1"
                style={{ color: 'var(--gallery-fg)' }}
              >
                Ask about this document
              </h3>
              <p
                className="text-sm mb-6 text-center max-w-xs"
                style={{ color: 'var(--gallery-muted)' }}
              >
                {docInfo?.status === "processing"
                  ? "Document is still being processed..."
                  : "Ask anything — I'll answer based on the document content"}
              </p>
              {docInfo?.status === "ready" && (
                <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action}
                      onClick={() => handleSend(action)}
                      className="px-3 py-1.5 text-xs font-medium rounded-full"
                      style={{
                        color: 'var(--gallery-muted)',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--violet-soft)';
                        e.currentTarget.style.borderColor = 'var(--border-hover)';
                        e.currentTarget.style.color = 'var(--gallery-fg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.color = 'var(--gallery-muted)';
                      }}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  sources={msg.sources}
                  intent={msg.intent}
                  timestamp={msg.timestamp}
                />
              ))}
              {streaming && !queryStatus && messages[messages.length - 1]?.content === "" && (
                <TypingIndicator />
              )}
              {streaming && queryStatus && <TypingIndicator status={queryStatus} />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div
          className="p-3 flex-shrink-0"
          style={{
            background: 'var(--obsidian)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <ChatInput
            onSend={handleSend}
            disabled={streaming || docInfo?.status === "processing"}
            placeholder={
              docInfo?.status === "processing"
                ? "Document is still being processed..."
                : "Ask a question..."
            }
          />
        </div>
      </div>
    </div>
  );
}

// Thumbnail component that renders a PDF page to canvas
function PdfThumbnail({
  pdfUrl,
  pageNumber,
  isActive,
  isHighlighted,
  onClick,
}: {
  pdfUrl: string;
  pageNumber: number;
  isActive: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLButtonElement>(null);
  const renderedRef = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || renderedRef.current || !canvasRef.current || !pdfUrl) return;
    renderedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch {
        // thumbnail render failed silently
      }
    })();

    return () => { cancelled = true; };
  }, [visible, pdfUrl, pageNumber]);

  return (
    <button
      ref={containerRef}
      onClick={onClick}
      className={`relative block w-full rounded-xl overflow-hidden transition-all duration-150 ${
        isActive
          ? "ring-2 ring-indigo-500/60 ring-offset-1 ring-offset-[#0c0c12]"
          : "ring-1 ring-[rgba(255,255,255,0.06)] hover:ring-[rgba(129,140,248,0.2)]"
      } ${isHighlighted ? "ring-2 ring-indigo-400/60 ring-offset-1 ring-offset-[#0c0c12]" : ""}`}
    >
      <div className="w-14 h-[72px] bg-[#12121a] flex items-center justify-center overflow-hidden">
        {visible ? (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <>
            <FileText className="w-4 h-4 text-[rgba(148,163,184,0.2)]" />
            <span className="text-[10px] text-[rgba(148,163,184,0.32)] absolute bottom-1">
              {pageNumber}
            </span>
          </>
        )}
      </div>
      {isHighlighted && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
      )}
    </button>
  );
}

// Inline PDF embed component that uses dynamic import
function PdfViewerEmbed({
  pdfUrl,
  filename,
  currentPage,
  onPageChange,
  onTotalPagesChange,
  highlightedPages,
  zoom,
  fitMode,
}: {
  pdfUrl: string;
  filename: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (total: number) => void;
  highlightedPages: Set<number>;
  zoom: number;
  fitMode: "width" | "page";
}) {
  const [PdfDoc, setPdfDoc] = useState<any>(null);
  const [PdfPage, setPdfPage] = useState<any>(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pageWidth, setPageWidth] = useState(600);
  const [totalPages, setTotalPages] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visiblePagesRef = useRef<Map<number, number>>(new Map());
  const isScrollingRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.js`;
      setPdfDoc(() => mod.Document);
      setPdfPage(() => mod.Page);
    });
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      const container = containerRef.current;
      if (!container) return;
      const containerWidth = container.clientWidth;
      const newWidth = Math.min(800, (containerWidth - 80) * (zoom / 100));
      setPageWidth(newWidth);
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [zoom, fitMode]);

  // Scroll to page when currentPage changes (button, keyboard, input)
  useEffect(() => {
    const el = pageRefs.current.get(currentPage);
    if (!el) return;
    isScrollingRef.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => { isScrollingRef.current = false; }, 600);
  }, [currentPage]);

  // IntersectionObserver: detect which page is most visible during scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container || totalPages === 0) return;

    observerRef.current?.disconnect();
    visiblePagesRef.current.clear();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageNum = parseInt(entry.target.getAttribute("data-page") || "0", 10);
          if (pageNum === 0) continue;
          if (entry.isIntersecting) {
            visiblePagesRef.current.set(pageNum, entry.intersectionRatio);
          } else {
            visiblePagesRef.current.delete(pageNum);
          }
        }

        if (isScrollingRef.current) return;

        let bestPage = -1;
        let bestRatio = -1;
        visiblePagesRef.current.forEach((ratio, page) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestPage = page;
          }
        });

        if (bestPage >= 1 && bestPage <= totalPages) {
          onPageChange(bestPage);
        }
      },
      {
        root: container,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    const observeAll = () => {
      pageRefs.current.forEach((el, pageNum) => {
        observerRef.current?.observe(el);
      });
    };

    // Small delay to ensure refs are populated after pdfLoaded changes
    const t = setTimeout(observeAll, 100);
    return () => {
      clearTimeout(t);
      observerRef.current?.disconnect();
    };
  }, [totalPages, onPageChange]);

  if (!PdfDoc || !PdfPage) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-auto">
      <div className="flex flex-col items-center py-6 px-4">
        <PdfDoc
          file={pdfUrl}
          onLoadSuccess={({ numPages }: { numPages: number }) => {
            onTotalPagesChange(numPages);
            setTotalPages(numPages);
            setPdfLoaded(true);
          }}
          loading={
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className="bg-[#12121a] rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)]"
                  style={{ width: pageWidth }}
                >
                  <div className="aspect-[8.5/11] bg-[rgba(255,255,255,0.02)] flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  </div>
                </div>
              ))}
            </div>
          }
          error={
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-2">
                <FileText className="w-10 h-10 text-[rgba(148,163,184,0.2)] mx-auto" />
                <p className="text-sm text-[rgba(148,163,184,0.32)]">Failed to load PDF</p>
              </div>
            </div>
          }
        >
          {pdfLoaded &&
            Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={pageNum}
                data-page={pageNum}
                ref={(el) => {
                  if (el) pageRefs.current.set(pageNum, el);
                }}
                className={`mb-4 transition-all duration-300 ${
                  highlightedPages.has(pageNum) ? "scale-[1.01]" : ""
                }`}
              >
                <div
                  className={`relative bg-[#12121a] rounded-xl overflow-hidden transition-shadow duration-200 ${
                    highlightedPages.has(pageNum)
                      ? "shadow-[0_0_24px_rgba(99,102,241,0.12)] ring-2 ring-indigo-500/40"
                      : "shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                  }`}
                  style={{ width: pageWidth }}
                >
                  {highlightedPages.has(pageNum) && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[10px] font-medium rounded-full">
                        Cited
                      </span>
                    </div>
                  )}
                  <PdfPage
                    pageNumber={pageNum}
                    width={pageWidth}
                    loading={
                      <div className="aspect-[8.5/11] bg-[rgba(255,255,255,0.02)] flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                      </div>
                    }
                  />
                </div>
                <div className="text-center mt-2">
                  <span className="text-[10px] text-[rgba(148,163,184,0.32)] font-medium">
                    {pageNum}
                  </span>
                </div>
              </div>
            ))}
        </PdfDoc>
      </div>
    </div>
  );
}
