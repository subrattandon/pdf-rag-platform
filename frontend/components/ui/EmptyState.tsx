"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {icon && (
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: 'var(--violet-soft)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {icon}
        </div>
      )}
      <h3
        className="text-base font-semibold mb-1.5"
        style={{ color: 'var(--gallery-fg)' }}
      >
        {title}
      </h3>
      <p
        className="text-sm text-center max-w-sm mb-5 leading-relaxed"
        style={{ color: 'var(--gallery-muted)' }}
      >
        {description}
      </p>
      {action}
    </div>
  );
}
