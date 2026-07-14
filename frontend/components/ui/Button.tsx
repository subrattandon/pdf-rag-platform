"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", loading, icon, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-full focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]";

    const variants = {
      primary:
        "bg-[rgba(20,20,28,0.74)] text-[rgba(248,250,252,0.96)] border border-[rgba(129,140,248,0.15)] hover:bg-[rgba(30,30,42,0.85)] hover:border-[rgba(129,140,248,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.12)] focus:ring-2 focus:ring-[rgba(129,140,248,0.2)] focus:ring-offset-2 focus:ring-offset-[#060609]",
      secondary:
        "bg-transparent text-[rgba(248,250,252,0.96)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(129,140,248,0.06)] hover:border-[rgba(129,140,248,0.2)] focus:ring-2 focus:ring-[rgba(129,140,248,0.2)] focus:ring-offset-2 focus:ring-offset-[#060609]",
      ghost:
        "bg-transparent text-[rgba(248,250,252,0.56)] hover:bg-[rgba(129,140,248,0.06)] hover:text-[rgba(248,250,252,0.96)] focus:ring-2 focus:ring-[rgba(129,140,248,0.2)] focus:ring-offset-2 focus:ring-offset-[#060609]",
      danger:
        "bg-red-600/90 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-500/40 focus:ring-offset-2 focus:ring-offset-[#060609]",
    };

    const sizes = {
      sm: "h-8 px-3.5 text-xs gap-1.5",
      md: "h-10 px-5 text-sm gap-2",
      lg: "h-12 px-7 text-sm gap-2",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        style={{ transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
