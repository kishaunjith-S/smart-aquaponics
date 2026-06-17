'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggleButton } from './ThemeToggleButton';
import {
  Waves,
  LayoutDashboard,
  TrendingUp,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  KeyRound,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/trends',    label: 'Trends',    icon: TrendingUp },
  { href: '/chatbot',   label: 'Chatbot',   icon: MessageSquare },
  { href: '/api-keys',  label: 'API Keys',  icon: KeyRound },
];

function NavLink({ href, label, icon: Icon, pathname, onClick }) {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-1 py-1 text-sm font-medium transition-colors duration-150
        after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:transition-all after:duration-150
        ${
          isActive
            ? 'text-teal-600 dark:text-teal-400 after:bg-teal-600 dark:after:bg-teal-400'
            : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 after:bg-transparent hover:after:bg-teal-200 dark:hover:after:bg-teal-800'
        }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [userMenuOpen]);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-6">

            {/* ── Brand ─────────────────────────────────── */}
            <Link
              href={user ? '/dashboard' : '/'}
              className="flex shrink-0 items-center gap-2.5 group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm shadow-teal-500/30 group-hover:shadow-teal-500/50 transition-shadow">
                <Waves className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight text-[hsl(var(--foreground))]">
                Aqua<span className="text-teal-600 dark:text-teal-400">Tracker</span>
              </span>
            </Link>

            {/* ── Desktop nav links (logged-in) ──────────── */}
            {user && (
              <div className="hidden md:flex items-center gap-6 h-16">
                {NAV_LINKS.map((link) => (
                  <NavLink key={link.href} {...link} pathname={pathname} />
                ))}
              </div>
            )}

            {/* ── Right side ────────────────────────────── */}
            <div className="flex items-center gap-3 ml-auto">
              <ThemeToggleButton />

              {user ? (
                <>
                  {/* User menu */}
                  <div className="relative hidden md:block">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserMenuOpen((v) => !v);
                      }}
                      className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:border-teal-300 dark:hover:border-teal-700 hover:bg-[hsl(var(--accent))] transition-all duration-150"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-[10px] font-bold text-white uppercase">
                        {user.email?.[0] ?? 'U'}
                      </div>
                      <span className="max-w-[120px] truncate">{user.email}</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Dropdown */}
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-1 shadow-xl shadow-black/10 dark:shadow-black/40 animate-in fade-in slide-in-from-top-1 duration-100">
                        <div className="border-b border-[hsl(var(--border))] px-4 py-2.5">
                          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Signed in as</p>
                          <p className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">{user.email}</p>
                        </div>
                        <Link
                          href="/profile"
                          className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                        >
                          <User className="h-4 w-4 text-slate-400" />
                          Profile
                        </Link>
                        <button
                          onClick={logout}
                          className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mobile hamburger */}
                  <button
                    className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                    onClick={() => setMobileOpen((v) => !v)}
                    aria-label="Toggle menu"
                  >
                    {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden sm:inline-flex items-center rounded-lg border border-[hsl(var(--border))] bg-transparent px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all duration-150"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center rounded-lg bg-teal-600 hover:bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 hover:shadow-teal-500/30 transition-all duration-150"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer (logged-in only) ──────────────────── */}
      {user && mobileOpen && (
        <div className="md:hidden sticky top-16 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/98 backdrop-blur-md shadow-lg">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-3 space-y-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                      : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                  {label}
                </Link>
              );
            })}

            <div className="border-t border-[hsl(var(--border))] pt-2 mt-2 space-y-1">
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <User className="h-4 w-4 text-slate-400" />
                Profile
                <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))] font-normal truncate max-w-[140px]">{user.email}</span>
              </Link>
              <button
                onClick={() => { setMobileOpen(false); logout(); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
