"use client";

import { Search, Bell, ChevronDown } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-6 max-md:pl-14 flex-shrink-0"
      style={{
        height: '56px',
        background: 'var(--obsidian-surface)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-3">
        <div>
          <h1
            className="font-mono text-sm font-medium"
            style={{ color: 'var(--gallery-fg)', letterSpacing: '0.04em' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-xs"
              style={{ color: 'var(--gallery-ghost)', letterSpacing: '0.01em' }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-1.5">
        {actions}

        {/* Search */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl relative"
          style={{
            color: 'var(--gallery-ghost)',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--gallery-fg)';
            e.currentTarget.style.background = 'var(--violet-soft)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--gallery-ghost)';
            e.currentTarget.style.background = 'transparent';
          }}
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl relative"
          style={{
            color: 'var(--gallery-ghost)',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--gallery-fg)';
            e.currentTarget.style.background = 'var(--violet-soft)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--gallery-ghost)';
            e.currentTarget.style.background = 'transparent';
          }}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
            style={{
              background: '#22c55e',
              boxShadow: '0 0 6px rgba(34,197,94,0.6)',
              animation: 'pulse-soft 2s ease-in-out infinite',
            }}
          />
        </button>

        {/* User Avatar */}
        <button
          className="flex items-center gap-1.5 p-1 rounded-xl"
          style={{ transition: 'all var(--transition-fast)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(129,140,248,0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{
              background: 'var(--violet-soft)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span className="font-mono text-xs font-medium" style={{ color: 'var(--gallery-muted)' }}>U</span>
          </div>
          <ChevronDown className="w-3 h-3 hidden md:block" style={{ color: 'var(--gallery-ghost)' }} />
        </button>
      </div>
    </header>
  );
}
