"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight, FileText, MessageSquare, Search, Shield, Zap, Globe, Check, Bot, Send, ChevronRight } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Smart Extraction",
    description: "Advanced AI extracts text, tables, and visual content with precision.",
  },
  {
    icon: MessageSquare,
    title: "Natural Language",
    description: "Ask questions in plain English. Get answers with exact page citations.",
  },
  {
    icon: Search,
    title: "Cross-Document Search",
    description: "Search across your entire library or focus on specific documents.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade encryption. Your documents never leave your control.",
  },
  {
    icon: Zap,
    title: "Instant Processing",
    description: "Documents are processed in seconds, not minutes.",
  },
  {
    icon: Globe,
    title: "Universal Format",
    description: "Supports any PDF format including scanned documents and images.",
  },
];

const faqs = [
  {
    question: "How does PDF Sage work?",
    answer: "Upload any PDF document and our AI will analyze its content. You can then ask questions in natural language and get instant answers with exact page citations.",
  },
  {
    question: "What file formats are supported?",
    answer: "We support all PDF formats including scanned documents, image-based PDFs, and standard text PDFs.",
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use bank-grade encryption and your documents are never shared with third parties.",
  },
  {
    question: "How accurate are the AI responses?",
    answer: "Our AI provides highly accurate responses with exact page citations. You can always verify the source.",
  },
];

function AppMockup() {
  return (
    <div className="relative w-full max-w-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: 'var(--obsidian-elevated)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}
      >
        {/* Mockup header */}
        <div className="flex items-center px-4 gap-2" style={{ height: '36px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(239,68,68,0.7)' }} />
            <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(234,179,8,0.7)' }} />
            <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(34,197,94,0.7)' }} />
          </div>
          <div className="flex-1 text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-mono text-[9px]" style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--gallery-ghost)', letterSpacing: '0.1em' }}>
              <FileText className="w-2.5 h-2.5" />
              RESEARCH-PAPER.PDF
            </div>
          </div>
        </div>

        {/* Mockup body - split view */}
        <div className="flex" style={{ height: '280px' }}>
          {/* PDF side */}
          <div className="w-1/2 p-3" style={{ background: 'rgba(6,6,9,0.5)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-xl p-3" style={{ background: 'var(--obsidian-surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="space-y-2">
                <div className="h-2.5 rounded-lg" style={{ background: 'rgba(129,140,248,0.12)', width: '75%' }} />
                <div className="h-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', width: '100%' }} />
                <div className="h-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', width: '100%' }} />
                <div className="h-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', width: '83%' }} />
                <div className="h-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', width: '100%' }} />
                <div className="h-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', width: '66%' }} />
                <div className="h-5 rounded-lg mt-3" style={{ background: 'rgba(129,140,248,0.06)' }} />
                <div className="h-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', width: '100%' }} />
                <div className="h-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', width: '80%' }} />
                <div className="h-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', width: '100%' }} />
                <div className="h-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', width: '75%' }} />
              </div>
            </div>
          </div>

          {/* Chat side */}
          <div className="w-1/2 flex flex-col" style={{ background: 'rgba(6,6,9,0.3)' }}>
            <div className="flex-1 p-3 space-y-3 overflow-hidden">
              {/* User message */}
              <div className="flex justify-end">
                <div className="text-[10px] px-2.5 py-1.5 rounded-xl rounded-br-none max-w-[85%]" style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--gallery-fg)' }}>
                  What are the main findings?
                </div>
              </div>
              {/* Bot message */}
              <div className="flex gap-1.5">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Bot className="w-2.5 h-2.5" style={{ color: 'var(--violet-light)' }} />
                </div>
                <div className="text-[10px] px-2.5 py-1.5 rounded-xl rounded-bl-none max-w-[85%] leading-relaxed" style={{ background: 'var(--obsidian-surface)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--gallery-muted)' }}>
                  The study identifies three key findings:
                  <br /><br />
                  <span style={{ color: 'var(--gallery-fg)' }}>1.</span> Performance improved by 47%
                  <br />
                  <span style={{ color: 'var(--gallery-fg)' }}>2.</span> Cost reduction of 23%
                  <br />
                  <span style={{ color: 'var(--gallery-fg)' }}>3.</span> User satisfaction at 94%
                </div>
              </div>
              {/* Sources */}
              <div className="flex gap-1.5">
                <span className="font-mono text-[8px] px-1.5 py-0.5 rounded-lg" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--gallery-ghost)', letterSpacing: '0.08em' }}>PAGE 3</span>
                <span className="font-mono text-[8px] px-1.5 py-0.5 rounded-lg" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--gallery-ghost)', letterSpacing: '0.08em' }}>PAGE 7</span>
              </div>
            </div>

            {/* Input */}
            <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 rounded-xl px-2.5 py-1.5" style={{ background: 'var(--obsidian-surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="flex-1 font-mono text-[9px]" style={{ color: 'var(--gallery-ghost)', letterSpacing: '0.08em' }}>ASK A QUESTION...</span>
                <Send className="w-2.5 h-2.5" style={{ color: 'var(--violet-light)' }} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group p-6 rounded-2xl transition-all duration-300"
      style={{
        background: 'var(--obsidian-elevated)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(129,140,248,0.15)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <feature.icon className="w-4 h-4" style={{ color: 'var(--violet-light)' }} />
      </div>
      <h3 className="font-mono text-xs mb-2" style={{ color: 'var(--gallery-fg)', letterSpacing: '0.08em' }}>{feature.title.toUpperCase()}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--gallery-muted)' }}>{feature.description}</p>
    </motion.div>
  );
}

function RadialGlow({ className }: { className?: string }) {
  return (
    <div className={`absolute pointer-events-none ${className || ""}`} aria-hidden="true">
      <div className="w-full h-full" style={{
        background: 'radial-gradient(80% 60% at 50% 40%, rgba(59,130,246,0.12) 0%, rgba(15,23,42,0.04) 58%, transparent 100%)',
      }} />
    </div>
  );
}

export default function LandingPage() {
  const containerRef = useRef(null);
  const showcaseRef = useRef(null);
  const showcaseInView = useInView(showcaseRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroImageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <main className="noise-overlay" style={{ background: 'var(--obsidian)' }}>
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ padding: '20px clamp(1rem, 4vw, 3rem)' }}>
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-5 py-2.5 rounded-2xl glass-nav">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="font-serif text-sm italic" style={{ color: 'var(--violet-light)' }}>P</span>
            </div>
            <span className="font-mono text-xs hidden sm:block" style={{ color: 'var(--gallery-fg)', letterSpacing: '0.1em' }}>PDF SAGE</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="font-mono text-[10px] transition-colors duration-300" style={{ color: 'var(--gallery-ghost)', letterSpacing: '0.2em' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gallery-fg)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--gallery-ghost)')}
            >
              FEATURES
            </a>
            <a href="#faq" className="font-mono text-[10px] transition-colors duration-300" style={{ color: 'var(--gallery-ghost)', letterSpacing: '0.2em' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gallery-fg)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--gallery-ghost)')}
            >
              FAQ
            </a>
          </div>

          <Link
            href="/dashboard"
            className="group flex items-center gap-2 font-mono text-[10px] rounded-full transition-all duration-300"
            style={{
              color: 'var(--gallery-fg)',
              letterSpacing: '0.13em',
              padding: '0.625rem 1.25rem',
              border: '1px solid rgba(129,140,248,0.15)',
              background: 'linear-gradient(180deg, rgba(20,20,28,0.74) 0%, rgba(10,10,16,0.9) 100%)',
            }}
          >
            OPEN APP
            <ArrowUpRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: 'var(--violet-light)' }} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={containerRef} className="relative min-h-[100svh] flex items-center overflow-hidden">
        <RadialGlow className="absolute inset-0 opacity-20 overflow-hidden" />

        <div className="relative z-10 w-full max-w-[1440px] mx-auto" style={{ padding: 'clamp(7rem, 6vw, 8rem) clamp(1.25rem, 4.236vw, 4.236rem) clamp(4rem, 6vw, 8rem)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] items-center" style={{ gap: 'clamp(2.618rem, 4vw, 4.236rem)' }}>
            {/* Left - Text */}
            <div className="items-center text-center lg:items-stretch lg:text-left" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(2rem, 2.618vw, 2.618rem)' }}>
              <div>
                <div className="items-center lg:items-end lg:text-right" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1.618rem, 2vw, 2.618rem)' }}>
                  {/* Headline */}
                  <motion.div style={{ y, opacity, display: 'flex', flexDirection: 'column', gap: '0.236em', fontFamily: 'var(--font-serif)' }} className="items-center lg:items-end">
                    <h1 className="font-light italic" style={{ fontSize: 'var(--fs-display)', color: 'var(--gallery-fg)', letterSpacing: '-0.035em', lineHeight: '0.92' }}>Ask questions.</h1>
                    <h1 className="font-semibold" style={{ fontSize: 'var(--fs-display)', color: 'var(--gallery-fg)', letterSpacing: '-0.04em', lineHeight: '0.92', opacity: '0.382' }}>To your documents.</h1>
                  </motion.div>

                  {/* Subheadline */}
                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="text-sm"
                    style={{ color: 'var(--gallery-muted)', maxWidth: '38.2ch', lineHeight: '1.618' }}
                  >
                    Upload any PDF and get instant answers with source citations.
                    Powered by AI, grounded in your documents.
                  </motion.p>

                  {/* Keywords */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-1 flex items-center justify-center lg:justify-end flex-wrap gap-3"
                  >
                    <span className="font-mono text-[9px]" style={{ color: 'var(--gallery-ghost)', letterSpacing: '0.2em' }}>ANALYSIS</span>
                    <span className="w-1 h-1 rounded-full" style={{ background: 'rgba(129,140,248,0.3)' }} />
                    <span className="font-mono text-[9px]" style={{ color: 'var(--gallery-ghost)', letterSpacing: '0.2em' }}>CITATIONS</span>
                    <span className="w-1 h-1 rounded-full" style={{ background: 'rgba(129,140,248,0.3)' }} />
                    <span className="font-mono text-[9px]" style={{ color: 'var(--gallery-ghost)', letterSpacing: '0.2em' }}>SPEED</span>
                  </motion.div>
                </div>

                {/* CTAs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-8 flex flex-wrap items-center justify-center lg:justify-end gap-3"
                >
                  <Link
                    href="/dashboard"
                    className="group flex items-center gap-2 font-mono text-[10px] rounded-full transition-all duration-500"
                    style={{
                      color: 'rgba(248,250,252,0.96)',
                      letterSpacing: '0.13em',
                      padding: '0.9rem 1.4rem',
                      border: '1px solid rgba(129,140,248,0.15)',
                      background: 'linear-gradient(180deg, rgba(20,20,28,0.74) 0%, rgba(10,10,16,0.9) 100%)',
                    }}
                  >
                    <span className="relative">GET STARTED<span className="absolute -bottom-0.5 left-0 h-px transition-all duration-500 group-hover:w-full" style={{ width: '0%', background: 'linear-gradient(90deg, rgba(129,140,248,0.4), rgba(129,140,248,0.8))' }} /></span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: 'var(--violet-light)' }} />
                  </Link>
                  <a
                    href="#features"
                    className="group flex items-center gap-2 font-mono text-[10px] rounded-full transition-all duration-500"
                    style={{
                      color: 'var(--gallery-muted)',
                      letterSpacing: '0.13em',
                      padding: '0.9rem 1.4rem',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(12,12,18,0.42)',
                    }}
                  >
                    <span className="group-hover:text-white transition-colors duration-300">LEARN MORE</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: 'var(--violet-light)', opacity: 0.8 }} />
                  </a>
                </motion.div>

                {/* Trust */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-8 flex items-center justify-center lg:justify-end gap-4"
                >
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--gallery-ghost)' }}>
                    <Check className="w-3 h-3" style={{ color: '#22c55e' }} />
                    No credit card required
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--gallery-ghost)' }}>
                    <Check className="w-3 h-3" style={{ color: '#22c55e' }} />
                    Free to start
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Vertical divider */}
            <div className="hidden lg:block h-full min-h-[420px] w-px justify-self-center" aria-hidden="true" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.06) 12%, rgba(129,140,248,0.15) 50%, rgba(255,255,255,0.06) 88%, transparent 100%)' }} />

            {/* Right - App Mockup */}
            <motion.div style={{ y: heroImageY }} className="hidden lg:block w-full max-w-[460px] justify-self-start">
              <AppMockup />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
        >
          <span className="hidden lg:block font-mono text-[10px]" style={{ color: 'var(--gallery-ghost)', letterSpacing: '0.2em' }}>SCROLL</span>
          <div className="relative w-px h-14 overflow-hidden">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(148,163,184,0.32) 0%, rgba(148,163,184,0.18) 100%)', opacity: 0.5 }} />
            <motion.div
              animate={{ scaleY: [0.08, 0.42, 0.08] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0" style={{ transformOrigin: 'bottom', background: 'linear-gradient(180deg, rgba(129,140,248,0.25) 0%, rgba(129,140,248,0.95) 100%)', opacity: 0.42 }}
            />
          </div>
        </motion.div>
      </section>

      {/* Showcase Section */}
      <section ref={showcaseRef} className="relative" style={{ background: 'var(--obsidian-surface)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'var(--section-py-sm) 0' }}>
        <div className="max-w-[1440px] mx-auto" style={{ padding: '0 var(--section-px)' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={showcaseInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: 'var(--obsidian-elevated)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="relative z-10 py-16 px-8 lg:px-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={showcaseInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <p className="font-mono text-[10px] mb-4" style={{ color: 'var(--gallery-ghost)', letterSpacing: '0.1em' }}>TRUSTED BY TEAMS WORLDWIDE</p>
                <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-light italic mb-5" style={{ color: 'var(--gallery-fg)', letterSpacing: '-0.035em', lineHeight: '1.1' }}>
                  Your documents deserve<br />
                  <span style={{ opacity: 0.382 }}>better answers.</span>
                </h2>
                <p className="text-sm max-w-lg mx-auto mb-8" style={{ color: 'var(--gallery-muted)', lineHeight: '1.618' }}>
                  Stop searching through hundreds of pages. Ask a question and get instant, accurate answers with exact page citations.
                </p>
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-2 font-mono text-[10px] rounded-full transition-all duration-500"
                  style={{
                    color: 'var(--gallery-fg)',
                    letterSpacing: '0.13em',
                    padding: '0.9rem 1.4rem',
                    border: '1px solid rgba(129,140,248,0.15)',
                    background: 'linear-gradient(180deg, rgba(20,20,28,0.74) 0%, rgba(10,10,16,0.9) 100%)',
                  }}
                >
                  TRY IT NOW
                  <ChevronRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" style={{ color: 'var(--violet-light)' }} />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative" style={{ background: 'var(--obsidian)', padding: 'var(--section-py) 0' }}>
        <div className="max-w-[1440px] mx-auto" style={{ padding: '0 var(--section-px)' }}>
          <div className="max-w-xl mb-14">
            <p className="font-mono text-[10px] mb-4" style={{ color: 'var(--violet-light)', letterSpacing: '0.1em' }}>FEATURES</p>
            <h2 className="font-serif text-2xl md:text-3xl font-light italic mb-4" style={{ color: 'var(--gallery-fg)', letterSpacing: '-0.035em', lineHeight: '1.1' }}>
              Everything you need<br />
              <span style={{ opacity: 0.382 }}>to work smarter.</span>
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--gallery-muted)' }}>
              Turn your PDFs into interactive knowledge bases. Ask questions,
              get answers, and discover insights you never knew existed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <FeatureCard key={i} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative" style={{ background: 'var(--obsidian-surface)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'var(--section-py) 0' }}>
        <div className="max-w-[1440px] mx-auto" style={{ padding: '0 var(--section-px)' }}>
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <p className="font-mono text-[10px] mb-4" style={{ color: 'var(--violet-light)', letterSpacing: '0.1em' }}>FAQ</p>
              <h2 className="font-serif text-xl md:text-2xl font-light italic mb-3" style={{ color: 'var(--gallery-fg)', letterSpacing: '-0.035em' }}>Got questions?</h2>
              <p className="text-sm" style={{ color: 'var(--gallery-muted)' }}>
                Everything you need to know about PDF Sage.
              </p>
            </div>

            <div className="lg:col-span-8 space-y-3">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="p-5 rounded-2xl"
                  style={{ background: 'var(--obsidian-elevated)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <h3 className="font-mono text-xs mb-2" style={{ color: 'var(--gallery-fg)', letterSpacing: '0.05em' }}>{faq.question}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--gallery-muted)' }}>{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative" style={{ background: 'var(--obsidian)', padding: 'var(--section-py) 0' }}>
        <div className="max-w-[1440px] mx-auto" style={{ padding: '0 var(--section-px)' }}>
          <div className="relative p-12 lg:p-16 text-center overflow-hidden rounded-2xl" style={{ background: 'var(--obsidian-elevated)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px]" style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.1), transparent 70%)' }} />

            <div className="relative z-10">
              <p className="font-mono text-[10px] mb-4" style={{ color: 'var(--gallery-ghost)', letterSpacing: '0.1em' }}>GET STARTED</p>
              <h2 className="font-serif text-2xl md:text-3xl font-light italic mb-4" style={{ color: 'var(--gallery-fg)', letterSpacing: '-0.035em', lineHeight: '1.1' }}>
                Ready to transform<br />
                your workflow?
              </h2>
              <p className="text-sm max-w-sm mx-auto mb-8" style={{ color: 'var(--gallery-muted)' }}>
                Start for free. No credit card required.
              </p>
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 font-mono text-[10px] rounded-full transition-all duration-500"
                style={{
                  color: 'var(--gallery-fg)',
                  letterSpacing: '0.13em',
                  padding: '0.9rem 1.4rem',
                  border: '1px solid rgba(129,140,248,0.15)',
                  background: 'linear-gradient(180deg, rgba(20,20,28,0.74) 0%, rgba(10,10,16,0.9) 100%)',
                }}
              >
                OPEN APP
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: 'var(--violet-light)' }} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--obsidian-surface)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(1.25rem, 2.5vw, 2rem) 0' }}>
        <div className="max-w-[1440px] mx-auto" style={{ padding: '0 var(--section-px)' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="font-serif text-sm italic" style={{ color: 'var(--violet-light)' }}>P</span>
              </div>
              <span className="font-mono text-xs" style={{ color: 'var(--gallery-fg)', letterSpacing: '0.1em' }}>PDF SAGE</span>
            </div>
            <p className="font-mono text-[10px]" style={{ color: 'var(--gallery-muted)', letterSpacing: '0.08em' }}>
              &copy; 2026 PDF SAGE. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
