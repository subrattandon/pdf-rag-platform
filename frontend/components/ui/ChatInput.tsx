"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div
        className="flex items-end gap-2 rounded-2xl p-2"
        style={{
          background: 'var(--obsidian-surface)',
          border: '1px solid var(--border-line)',
          transition: 'all 200ms ease',
        }}
        onFocus={(e) => {
          const container = e.currentTarget;
          container.style.borderColor = 'rgba(129,140,248,0.3)';
          container.style.boxShadow = '0 0 0 3px rgba(129,140,248,0.08), 0 0 16px rgba(99,102,241,0.06)';
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            const container = e.currentTarget;
            container.style.borderColor = 'var(--border-line)';
            container.style.boxShadow = 'none';
          }
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Ask a question..."}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none px-2.5 py-1.5 text-sm focus:outline-none disabled:opacity-50 bg-transparent"
          style={{
            color: 'var(--gallery-fg)',
          }}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          style={{
            background: 'var(--violet-soft)',
            border: '1px solid var(--border-line)',
            color: 'var(--violet-light)',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.background = 'rgba(129,140,248,0.2)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(99,102,241,0.15)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--violet-soft)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--gallery-ghost)' }}>
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
}
