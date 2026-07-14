"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useApiClient } from "@/lib/api-client";
import { Settings, User, CreditCard, Bell } from "lucide-react";

interface UserInfo {
  id: string;
  email: string;
  plan: string;
}

export default function SettingsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const api = useApiClient();

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await api.getSubscription();
        setUser({ id: "", email: "", plan: data.tier || "free" });
      } catch {
        setUser({ id: "", email: "", plan: "free" });
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [api]);

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
        <Header title="Settings" subtitle="Manage your account and preferences" />

        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto mt-8 space-y-5">
            {/* Profile Section */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'var(--obsidian-elevated)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'var(--violet-soft)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <User className="w-4 h-4" style={{ color: 'var(--gallery-ghost)' }} />
                </div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--gallery-fg)' }}>Profile</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--gallery-ghost)' }}>Email</label>
                  <p className="text-sm mt-1" style={{ color: 'var(--gallery-fg)' }}>
                    {loading ? "Loading..." : user?.email || "Not available"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--gallery-ghost)' }}>Plan</label>
                  <p className="text-sm mt-1 capitalize" style={{ color: 'var(--gallery-fg)' }}>
                    {loading ? "Loading..." : user?.plan || "Free"}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Section */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'var(--obsidian-elevated)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'var(--violet-soft)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <CreditCard className="w-4 h-4" style={{ color: 'var(--gallery-ghost)' }} />
                </div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--gallery-fg)' }}>Subscription</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--gallery-ghost)' }}>
                    Current Plan
                  </label>
                  <p className="text-sm mt-1" style={{ color: 'var(--gallery-fg)' }}>
                    {loading
                      ? "Loading..."
                      : `You are on the ${
                          (user?.plan || "free").charAt(0).toUpperCase() +
                          (user?.plan || "free").slice(1)
                        } plan`}
                  </p>
                </div>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium"
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
                  Upgrade Plan
                </button>
              </div>
            </div>

            {/* Notifications Section */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'var(--obsidian-elevated)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'var(--violet-soft)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Bell className="w-4 h-4" style={{ color: 'var(--gallery-ghost)' }} />
                </div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--gallery-fg)' }}>Notifications</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--gallery-muted)' }}>
                    Email notifications for document processing
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded"
                    style={{
                      accentColor: 'var(--violet-light)',
                    }}
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--gallery-muted)' }}>Usage alerts</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded"
                    style={{
                      accentColor: 'var(--violet-light)',
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
