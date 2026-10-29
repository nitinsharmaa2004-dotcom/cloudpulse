"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SWRProvider } from "@/components/providers/swr-provider";
import type { Role } from "@/types/api";
import { AlertsProvider, useAlertsContext } from "./alerts-context";
import { SidebarNav } from "./sidebar";
import { Notifications } from "./notifications";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";

type ShellUser = { name: string; email: string; role: Role; company: string | null };

function LiveIndicator() {
  const { live } = useAlertsContext();
  return (
    <span className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400 md:inline-flex">
      <span className="relative flex h-2 w-2">
        {live && <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-400" />}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", live ? "bg-emerald-500" : "bg-zinc-400")} />
      </span>
      {live ? "Live monitoring" : "Reconnecting…"}
    </span>
  );
}

export function DashboardShell({ user, initialUnread, children }: { user: ShellUser; initialUnread: number; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  return (
    <SWRProvider>
      <AlertsProvider initialUnread={initialUnread}>
        <div className="min-h-screen">
          <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-zinc-200/80 bg-white/60 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0a0b10]/60 lg:block">
            <SidebarNav />
          </aside>

          {mobileOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden />
              <aside className="absolute inset-y-0 left-0 w-72 animate-fade-up border-r border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0a0b10]">
                <button onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="absolute right-3 top-4 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10">
                  <X className="h-4 w-4" />
                </button>
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </aside>
            </div>
          )}

          <div className="lg:pl-64">
            <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-zinc-200/80 bg-white/70 px-4 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#07080c]/70 sm:px-6">
              <button onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-white/10 lg:hidden">
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-500">
                  <span className="font-medium text-zinc-900 dark:text-white">{user.company ?? "Personal workspace"}</span>
                  <span className="hidden sm:inline"> · AWS · all regions</span>
                </p>
              </div>
              <LiveIndicator />
              <ThemeToggle />
              <Notifications />
              <UserMenu name={user.name} email={user.email} role={user.role} />
            </header>
            <main key={pathname} className="mx-auto w-full max-w-[1600px] animate-fade-up px-4 py-6 sm:px-6 lg:px-8 lg:py-8 3xl:max-w-[2000px]">
              {children}
            </main>
          </div>
        </div>
      </AlertsProvider>
    </SWRProvider>
  );
}
