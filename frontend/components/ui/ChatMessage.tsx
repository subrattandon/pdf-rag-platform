"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw, Trash2, User, Bot } from "lucide-react";
import Badge from "./Badge";

interface Source {
  doc_id: string;
  page: number;
  chunk_text: string;
  score: number;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  intent?: string;
  timestamp?: Date;
  onRetry?: () => void;
  onDelete?: () => void;
}

function getIntentLabel(intent: string): string {
  const labels: Record<string, string> = {
    answer: "Answer",
    summarize: "Summary",
    explain: "Explanation",
    extract: "Extraction",
    compare: "Comparison",
    list: "List",
    define: "Definition",
    outline: "Outline",
  };
  return labels[intent] || "Answer";
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="text-sm font-semibold mt-3 mb-1" style={{ color: 'var(--gallery-fg)' }}>
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="text-base font-semibold mt-3 mb-1" style={{ color: 'var(--gallery-fg)' }}>
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="text-lg font-semibold mt-3 mb-1" style={{ color: 'var(--gallery-fg)' }}>
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2 ml-2">
              <span style={{ color: 'var(--violet-light)' }}>•</span>
              <span className="text-sm" style={{ color: 'var(--gallery-muted)' }}>
                {renderInlineMarkdown(line.slice(2))}
              </span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          const match = line.match(/^(\d+)\.\s(.*)/);
          return (
            <div key={i} className="flex gap-2 ml-2">
              <span className="font-medium text-sm" style={{ color: 'var(--violet-light)' }}>{match?.[1]}.</span>
              <span className="text-sm" style={{ color: 'var(--gallery-muted)' }}>
                {renderInlineMarkdown(match?.[2] || "")}
              </span>
            </div>
          );
        }
        if (line.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="border-l-2 pl-3 text-sm italic"
              style={{
                borderColor: 'rgba(129,140,248,0.3)',
                color: 'var(--gallery-muted)',
              }}
            >
              {renderInlineMarkdown(line.slice(2))}
            </blockquote>
          );
        }
        if (line.startsWith("```")) {
          return null;
        }
        if (line.trim() === "") {
          return <div key={i} className="h-1.5" />;
        }
        return (
          <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--gallery-muted)' }}>
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold" style={{ color: 'var(--gallery-fg)' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded text-xs font-mono"
          style={{
            background: 'rgba(129,140,248,0.1)',
            color: 'rgba(165,180,252,0.9)',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function ChatMessage({
  role,
  content,
  sources,
  intent,
  timestamp,
  onRetry,
  onDelete,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group flex gap-2.5 ${role === "user" ? "justify-end" : "justify-start"}`}>
      {role === "assistant" && (
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'var(--violet-soft)',
            border: '1px solid var(--border-line)',
          }}
        >
          <Bot className="w-3.5 h-3.5" style={{ color: 'var(--violet-light)' }} />
        </div>
      )}

      <div className={`max-w-[80%] ${role === "user" ? "order-1" : ""}`}>
        {role === "assistant" && intent && (
          <div className="mb-1.5">
            <Badge variant="default" size="sm">
              {getIntentLabel(intent)}
            </Badge>
          </div>
        )}

        <div
          className="rounded-2xl px-3.5 py-2.5"
          style={{
            background: role === "user" ? 'rgba(129,140,248,0.08)' : 'var(--obsidian-elevated)',
            border: role === "user" ? '1px solid rgba(129,140,248,0.12)' : '1px solid var(--border-line)',
            color: 'var(--gallery-fg)',
            boxShadow: role === "user" ? 'none' : '0 1px 3px rgba(0,0,0,0.15)',
          }}
        >
          {role === "assistant" ? (
            <SimpleMarkdown content={content} />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          )}
        </div>

        {timestamp && (
          <p
            className={`text-xs mt-1 ${role === "user" ? "text-right" : "text-left"}`}
            style={{ color: 'var(--gallery-ghost)' }}
          >
            {formatTime(timestamp)}
          </p>
        )}

        {role === "assistant" && sources && sources.length > 0 && (
          <div className="mt-2 space-y-1.5">
            <p className="text-xs font-medium" style={{ color: 'var(--gallery-ghost)' }}>Sources</p>
            {sources.map((source, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2 rounded-lg"
                style={{
                  background: 'rgba(129,140,248,0.04)',
                  border: '1px solid rgba(129,140,248,0.08)',
                }}
              >
                <Badge variant="info" size="sm">
                  Page {source.page}
                </Badge>
                <span className="text-xs line-clamp-2" style={{ color: 'var(--gallery-muted)' }}>
                  {source.chunk_text}
                </span>
              </div>
            ))}
          </div>
        )}

        {role === "assistant" && (
          <div
            className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100"
            style={{ transition: 'opacity 200ms ease' }}
          >
            <button
              onClick={handleCopy}
              className="p-1 rounded-lg"
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
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {onRetry && (
              <button
                onClick={onRetry}
                className="p-1 rounded-lg"
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
                title="Retry"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1 rounded-lg"
                style={{
                  color: 'var(--gallery-ghost)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#f87171';
                  e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--gallery-ghost)';
                  e.currentTarget.style.background = 'transparent';
                }}
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {role === "user" && (
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(129,140,248,0.12)',
            border: '1px solid rgba(129,140,248,0.12)',
          }}
        >
          <User className="w-3.5 h-3.5" style={{ color: 'var(--violet-light)' }} />
        </div>
      )}
    </div>
  );
}
