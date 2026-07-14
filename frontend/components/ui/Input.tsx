"use client";

import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label
            className="text-xs font-medium"
            style={{ color: "var(--gallery-ghost)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors ${className}`}
          style={{
            background: "var(--obsidian)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "var(--gallery-fg)",
          }}
          {...props}
        />
        {error && (
          <p className="text-xs" style={{ color: "#ef4444" }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
