"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Search,
  LogOut,
  Pill,
  Menu,
  X,
  FileText,
  Activity,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Bills & documents", icon: FileText },
  { href: "/medical-reports", label: "Medical reports", icon: Activity },
  { href: "/search", label: "Search", icon: Search },
];

function NavLinks({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={cn("space-y-1", className)}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  familyName,
  userName,
  pathname,
  onNavigate,
  onClose,
  showClose,
}: {
  familyName: string;
  userName?: string;
  pathname: string;
  onNavigate?: () => void;
  onClose?: () => void;
  showClose?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-2">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <div className="rounded-xl bg-teal-600 p-2.5">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-slate-900">RxBox</p>
              <p className="truncate text-xs text-slate-500">{familyName}</p>
            </div>
          </Link>
          {showClose && (
            <button
              type="button"
              aria-label="Close menu"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Menu
        </p>
        <NavLinks pathname={pathname} onNavigate={onNavigate} />

        <div className="mt-6 px-1">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Quick search
          </p>
          <SearchBar />
        </div>
      </div>

      <div className="border-t border-slate-200 p-4">
        {userName && (
          <p className="mb-3 truncate px-1 text-sm font-medium text-slate-700">
            {userName}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-slate-600"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  familyName,
  userName,
}: {
  children: React.ReactNode;
  familyName: string;
  userName?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const activeItem = navItems.find(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Left sidebar — drawer on mobile, fixed on desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-out lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent
          familyName={familyName}
          userName={userName}
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
          onClose={() => setMobileOpen(false)}
          showClose={mobileOpen}
        />
      </aside>

      {/* Main column */}
      <div className="min-w-0 flex-1 overflow-x-hidden lg:pl-72">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button
              type="button"
              aria-label="Open menu"
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {activeItem?.label ?? "RxBox"}
              </p>
              <p className="truncate text-xs text-slate-500">{familyName}</p>
            </div>
            <div className="rounded-xl bg-teal-600 p-2">
              <Pill className="h-4 w-4 text-white" />
            </div>
          </div>
        </header>

        {/* Desktop page header strip */}
        <header className="hidden border-b border-slate-200 bg-white px-6 py-4 lg:block">
          <h1 className="text-lg font-semibold text-slate-900">
            {activeItem?.label ?? "RxBox"}
          </h1>
        </header>

        <main className="min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto min-w-0 max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
