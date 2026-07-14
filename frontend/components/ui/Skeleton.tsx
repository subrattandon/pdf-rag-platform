"use client";

import { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string;
  height?: string;
  lines?: number;
}

export default function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
  lines = 1,
  ...props
}: SkeletonProps) {
  const baseStyles = "animate-pulse rounded-lg";

  const variants = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-xl",
    card: "h-48 rounded-2xl",
  };

  const shimmerStyle = {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={`space-y-2.5 ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseStyles} ${variants.text}`}
            style={{
              ...shimmerStyle,
              width: i === lines - 1 ? "60%" : "100%",
              ...({ width: width } as any),
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseStyles} ${variants[variant]}`}
      style={{ ...shimmerStyle, width, height }}
      {...props}
    />
  );
}
