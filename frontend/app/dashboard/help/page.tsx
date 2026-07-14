"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { HelpCircle, ChevronDown, ChevronUp, FileText, MessageSquare, Upload } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "How do I upload a PDF?",
    answer:
      "Navigate to the Dashboard and click 'Upload PDF' or drag and drop a file into the upload area. Your PDF will be processed and indexed automatically.",
  },
  {
    question: "What file formats are supported?",
    answer:
      "Currently, we support PDF files up to 50 pages. We're working on adding support for more formats including DOCX, TXT, and images.",
  },
  {
    question: "How does the AI chat work?",
    answer:
      "After uploading a PDF, open it and use the AI Assistant on the right panel. Ask any question about the document and get instant, accurate answers with source citations.",
  },
  {
    question: "What are the usage limits?",
    answer:
      "Free tier includes 5 PDF uploads, 50 pages per PDF, and 20 queries per month. Upgrade to Pro for higher limits.",
  },
  {
    question: "How do I delete a document?",
    answer:
      "Click on a document in the dashboard, then use the delete option. This removes the document and all its associated data from our servers.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. All documents are encrypted at rest and in transit. We use enterprise-grade security and never share your data with third parties.",
  },
];

function FAQItem({ item }: { item: (typeof FAQ_ITEMS)[0] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
        style={{
          transition: 'all 150ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(129,140,248,0.03)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--gallery-fg)' }}>
          {item.question}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--gallery-ghost)' }} />
        ) : (
          <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--gallery-ghost)' }} />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--gallery-muted)' }}>
            {item.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen" style={{ background: 'var(--obsidian)' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onMobileToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onNewDocument={() => {}}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Help" subtitle="Get support and documentation" />

        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto mt-8 space-y-6">
            {/* Quick Start */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'var(--obsidian-elevated)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gallery-fg)' }}>
                Quick Start Guide
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.15)',
                    }}
                  >
                    <Upload className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--gallery-fg)' }}>
                      1. Upload your PDF
                    </p>
                    <p className="text-sm" style={{ color: 'var(--gallery-muted)' }}>
                      Go to Dashboard and upload any PDF document
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.15)',
                    }}
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--gallery-fg)' }}>
                      2. Wait for processing
                    </p>
                    <p className="text-sm" style={{ color: 'var(--gallery-muted)' }}>
                      The AI will extract and index your document content
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(139,92,246,0.1)',
                      border: '1px solid rgba(139,92,246,0.15)',
                    }}
                  >
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--gallery-fg)' }}>
                      3. Ask questions
                    </p>
                    <p className="text-sm" style={{ color: 'var(--gallery-muted)' }}>
                      Open the document and chat with the AI about its content
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'var(--obsidian-elevated)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gallery-fg)' }}>
                Frequently Asked Questions
              </h3>
              <div className="space-y-2">
                {FAQ_ITEMS.map((item, i) => (
                  <FAQItem key={i} item={item} />
                ))}
              </div>
            </div>

            {/* Contact */}
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                background: 'var(--obsidian-elevated)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <HelpCircle
                className="w-10 h-10 mx-auto mb-3"
                style={{ color: 'var(--gallery-ghost)' }}
              />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gallery-fg)' }}>
                Still need help?
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--gallery-muted)' }}>
                Contact our support team for assistance with your account or technical issues.
              </p>
              <a
                href="mailto:support@pdfsage.app"
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: 'var(--violet-soft)',
                  color: 'var(--violet-light)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(129,140,248,0.2)';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(99,102,241,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--violet-soft)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Contact Support
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
