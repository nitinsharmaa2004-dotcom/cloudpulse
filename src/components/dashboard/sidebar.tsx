"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";
import { useAlertsContext } from "./alerts-context";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { unread } = useAlertsContext();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo href="/dashboard" />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Dashboard">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Workspace</p>
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-zinc-900 text-white shadow-sm dark:bg-white/[0.08] dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-white",
              )}
            >
              <item.icon className={cn("h-4 w-4", active ? "text-white" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300")} />
              <span className="flex-1">{item.label}</span>
              {item.href === "/dashboard/alerts" && unread > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">{unread > 99 ? "99+" : unread}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-3">
        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-br from-brand-50 to-violet-50 p-4 dark:border-white/[0.08] dark:from-brand-500/10 dark:to-violet-500/5">
          <Sparkles className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          <p className="mt-2 text-sm font-semibold">Pro trial · 12 days left</p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Unlock unlimited accounts and Slack alerts.</p>
          <Link href="/#pricing" className="mt-3 inline-flex text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Upgrade plan →
          </Link>
        </div>
      </div>
    </div>
  );
}
