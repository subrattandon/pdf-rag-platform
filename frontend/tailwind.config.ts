import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        border: "hsl(var(--border))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        ring: "hsl(var(--ring))",
        input: "hsl(var(--input))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          border: "hsl(var(--sidebar-border))",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        mono: ["Space Mono", "monospace"],
      },
      fontSize: {
        "display-2xl": ["4.5rem", { lineHeight: "0.92", letterSpacing: "-0.035em", fontWeight: "300" }],
        "display-xl": ["4rem", { lineHeight: "0.92", letterSpacing: "-0.035em", fontWeight: "300" }],
        "display-lg": ["3rem", { lineHeight: "0.92", letterSpacing: "-0.035em", fontWeight: "300" }],
        "display-md": ["2rem", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.618" }],
        "body-md": ["1rem", { lineHeight: "1.618" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        "label": ["0.6875rem", { lineHeight: "1", letterSpacing: "0.25em", fontWeight: "500" }],
        "nav": ["0.78rem", { lineHeight: "1", letterSpacing: "0.13em", fontWeight: "500" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "glow": "0 0 48px rgba(99,102,241,0.22)",
        "glow-sm": "0 0 20px rgba(99,102,241,0.15)",
        "glass": "inset 0 1px 0 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.02)",
        "nav": "0 0 0 1px rgba(255,255,255,0.02), 0 2px 8px rgba(0,0,0,0.4)",
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out",
        "fade-up": "fade-up 0.6s ease-out",
        "shimmer": "shimmer 2s infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "slide-in": "slide-in 0.3s ease-out",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-10px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      transitionDuration: {
        "150": "150ms",
        "200": "200ms",
        "300": "300ms",
        "400": "400ms",
        "500": "500ms",
      },
      transitionTimingFunction: {
        "ease-out": "cubic-bezier(0.4, 0, 0.2, 1)",
        "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
        "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
        "spring": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
