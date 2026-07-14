"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Settings,
  BarChart3,
  HelpCircle,
  ChevronLeft,
  Plus,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  { name: "Documents", href: "/dashboard", icon: FileText },
  { name: "Usage", href: "/dashboard/usage", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Help", href: "/dashboard/help", icon: HelpCircle },
];

interface SidebarProps {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onToggle?: () => void;
  onMobileToggle?: () => void;
  onNewDocument?: () => void;
}

export default function Sidebar({ collapsed = false, mobileOpen = false, onToggle, onMobileToggle, onNewDocument }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={onMobileToggle}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-xl"
        style={{
          background: 'rgba(12, 12, 18, 0.9)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          color: 'var(--gallery-ghost)',
          transition: 'all var(--transition-fast)',
        }}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onMobileToggle}
            className="md:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(6,6,9,0.85)', backdropFilter: 'blur(4px)' }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 60 : 224 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="h-screen flex flex-col overflow-hidden max-md:fixed max-md:z-50 max-md:top-0 max-md:left-0"
        style={{
          background: 'var(--obsidian-surface)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3"
          style={{
            height: '56px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2.5"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="font-serif text-sm italic" style={{ color: 'var(--violet-light)' }}>P</span>
                </div>
                <span
                  className="font-mono text-xs font-medium"
                  style={{ color: 'var(--gallery-fg)', letterSpacing: '0.08em' }}
                >
                  PDF Sage
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{
              color: 'var(--gallery-ghost)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--gallery-fg)';
              e.currentTarget.style.background = 'var(--violet-soft)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--gallery-ghost)';
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* New Document Button */}
        <div className="p-3">
          <button
            onClick={onNewDocument}
            className="btn-primary w-full"
            style={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '10px' : '10px 14px',
            }}
          >
            <Plus className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--violet-light)' }} />
            {!collapsed && <span>NEW DOC</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-1 space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 768) onMobileToggle?.();
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-mono text-xs"
                style={{
                  letterSpacing: '0.08em',
                  color: isActive ? 'var(--gallery-fg)' : 'var(--gallery-ghost)',
                  background: isActive ? 'var(--violet-soft)' : 'transparent',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(129,140,248,0.04)';
                    e.currentTarget.style.color = 'var(--gallery-muted)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--gallery-ghost)';
                  }
                }}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                {!collapsed && <span>{item.name.toUpperCase()}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link
            href="/"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-mono text-xs"
            style={{
              letterSpacing: '0.08em',
              color: 'var(--gallery-ghost)',
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--gallery-muted)';
              e.currentTarget.style.background = 'rgba(129,140,248,0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--gallery-ghost)';
              e.currentTarget.style.background = 'transparent';
            }}
            title={collapsed ? "Back to home" : undefined}
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            {!collapsed && <span>HOME</span>}
          </Link>
        </div>
      </motion.aside>
    </>
  );
}
