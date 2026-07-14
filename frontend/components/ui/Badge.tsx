"use client";

import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  dot?: boolean;
}

export default function Badge({
  className = "",
  variant = "default",
  size = "sm",
  dot,
  children,
  ...props
}: BadgeProps) {
  const baseStyles = "inline-flex items-center font-medium rounded-full";

  const variants = {
    default: "bg-[rgba(255,255,255,0.04)] text-[rgba(248,250,252,0.56)]",
    success: "bg-[rgba(34,197,94,0.1)] text-emerald-400",
    warning: "bg-[rgba(245,158,11,0.1)] text-amber-400",
    error: "bg-[rgba(239,68,68,0.1)] text-red-400",
    info: "bg-[rgba(129,140,248,0.1)] text-indigo-400",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
  };

  const dotColors = {
    default: "bg-[rgba(148,163,184,0.4)]",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
    info: "bg-indigo-500",
  };

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}
          style={{
            boxShadow: variant === 'success' ? '0 0 4px rgba(34,197,94,0.4)' :
                        variant === 'warning' ? '0 0 4px rgba(245,158,11,0.4)' :
                        variant === 'error' ? '0 0 4px rgba(239,68,68,0.4)' :
                        variant === 'info' ? '0 0 4px rgba(129,140,248,0.4)' : 'none',
          }}
        />
      )}
      {children}
    </span>
  );
}
