"use client";

import { Bot } from "lucide-react";

interface TypingIndicatorProps {
  status?: string;
}

export default function TypingIndicator({ status }: TypingIndicatorProps) {
  return (
    <div className="flex gap-2.5">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: 'var(--violet-soft)',
          border: '1px solid var(--border-line)',
        }}
      >
        <Bot className="w-3.5 h-3.5" style={{ color: 'var(--violet-light)' }} />
      </div>
      <div
        className="rounded-2xl px-3.5 py-2.5"
        style={{
          background: 'var(--obsidian-elevated)',
          border: '1px solid var(--border-line)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: 'var(--violet-light)',
                animation: 'pulse-soft 1.4s ease-in-out infinite',
              }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: 'var(--violet-light)',
                animation: 'pulse-soft 1.4s ease-in-out infinite',
                animationDelay: '200ms',
              }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: 'var(--violet-light)',
                animation: 'pulse-soft 1.4s ease-in-out infinite',
                animationDelay: '400ms',
              }}
            />
          </div>
          {status && <span className="text-xs" style={{ color: 'var(--gallery-ghost)' }}>{status}</span>}
        </div>
      </div>
    </div>
  );
}
