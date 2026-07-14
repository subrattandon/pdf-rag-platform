"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useApiClient } from "@/lib/api-client";
import { BarChart3, FileText, MessageSquare, Clock } from "lucide-react";

interface UsageData {
  pdf_uploads: number;
  pages_processed: number;
  queries_made: number;
  tokens_used: number;
}

export default function UsagePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const api = useApiClient();

  useEffect(() => {
    async function fetchUsage() {
      try {
        const data = await api.getUsage();
        setUsage(data);
      } catch {
        setUsage({ pdf_uploads: 0, pages_processed: 0, queries_made: 0, tokens_used: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, [api]);

  const stats = [
    {
      label: "PDFs Uploaded",
      value: usage?.pdf_uploads ?? 0,
      icon: FileText,
      color: "rgba(129,140,248,0.1)",
      iconColor: "var(--violet-light)",
    },
    {
      label: "Pages Processed",
      value: usage?.pages_processed ?? 0,
      icon: Clock,
      color: "rgba(34,197,94,0.1)",
      iconColor: "#4ade80",
    },
    {
      label: "Queries Made",
      value: usage?.queries_made ?? 0,
      icon: MessageSquare,
      color: "rgba(139,92,246,0.1)",
      iconColor: "#a78bfa",
    },
    {
      label: "Tokens Used",
      value: usage?.tokens_used ?? 0,
      icon: BarChart3,
      color: "rgba(245,158,11,0.1)",
      iconColor: "#fbbf24",
    },
  ];

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
        <Header title="Usage" subtitle="Track your document usage and limits" />

        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto mt-8">
            <div className="grid grid-cols-2 gap-4 mb-8">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-5"
                  style={{
                    background: 'var(--obsidian-elevated)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(129,140,248,0.15)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center"
                      style={{
                        background: stat.color,
                        border: `1px solid ${stat.color}`,
                      }}
                    >
                      <stat.icon className="w-5 h-5" style={{ color: stat.iconColor }} />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--gallery-ghost)' }}>{stat.label}</p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--gallery-fg)' }}>
                        {loading ? "..." : stat.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="rounded-2xl p-6"
              style={{
                background: 'var(--obsidian-elevated)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--gallery-fg)' }}>
                Plan Limits
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span style={{ color: 'var(--gallery-muted)' }}>PDF Uploads</span>
                    <span className="font-medium" style={{ color: 'var(--gallery-fg)' }}>
                      {usage?.pdf_uploads ?? 0} / 5
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full h-1.5 overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(((usage?.pdf_uploads ?? 0) / 5) * 100, 100)}%`,
                        background: 'linear-gradient(90deg, rgba(129,140,248,0.5), rgba(139,92,246,0.7))',
                        boxShadow: '0 0 8px rgba(129,140,248,0.3)',
                        transition: 'width 500ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span style={{ color: 'var(--gallery-muted)' }}>Queries This Month</span>
                    <span className="font-medium" style={{ color: 'var(--gallery-fg)' }}>
                      {usage?.queries_made ?? 0} / 20
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full h-1.5 overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(((usage?.queries_made ?? 0) / 20) * 100, 100)}%`,
                        background: 'linear-gradient(90deg, rgba(139,92,246,0.5), rgba(168,85,247,0.7))',
                        boxShadow: '0 0 8px rgba(139,92,246,0.3)',
                        transition: 'width 500ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
