"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/client";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { AlertsResponse } from "@/types/api";
import { useAlertsContext } from "./alerts-context";
import { SeverityIcon } from "./status";
import { Skeleton } from "@/components/ui/skeleton";

export function Notifications() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { unread, setUnread, live, refreshAlerts } = useAlertsContext();
  const { data, isLoading } = useSWR<AlertsResponse>(open ? "/api/alerts?limit=6" : null);

  useEffect(() => {
    if (data) setUnread(data.unread);
  }, [data, setUnread]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function markAll() {
    try {
      await apiFetch("/api/alerts", { method: "PATCH", json: { all: true, read: true } });
      setUnread(0);
      refreshAlerts();
    } catch {
      toast.error("Could not update alerts");
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white/70 text-zinc-600 transition hover:text-zinc-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:text-white"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white dark:ring-[#07080c]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-16 z-50 animate-fade-up overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0d0f15] sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Notifications</p>
              <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium", live ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-emerald-500" : "bg-zinc-400")} />
                {live ? "Live" : "Offline"}
              </span>
            </div>
            <button onClick={markAll} disabled={!unread} className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline disabled:opacity-40 dark:text-brand-400">
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          </div>
          <ul className="max-h-[60vh] divide-y divide-zinc-100 overflow-y-auto dark:divide-white/[0.06]">
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="flex gap-3 p-4">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </li>
              ))}
            {data?.alerts.length === 0 && <li className="p-8 text-center text-sm text-zinc-500">You&apos;re all caught up.</li>}
            {data?.alerts.map((a) => (
              <li key={a.id} className={cn("flex gap-3 p-4", !a.read && "bg-brand-50/50 dark:bg-brand-500/[0.04]")}>
                <SeverityIcon severity={a.severity} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{a.message}</p>
                  <p className="mt-1 text-[11px] text-zinc-400">{formatRelativeTime(a.createdAt)}</p>
                </div>
                {!a.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-label="Unread" />}
              </li>
            ))}
          </ul>
          <Link href="/dashboard/alerts" onClick={() => setOpen(false)} className="block border-t border-zinc-100 py-2.5 text-center text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/[0.03]">
            View all alerts
          </Link>
        </div>
      )}
    </div>
  );
}
