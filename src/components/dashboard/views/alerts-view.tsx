"use client";

import { useState } from "react";
import useSWR from "swr";
import { BellOff, CheckCheck, Circle } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/client";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";
import type { AlertItem, AlertsResponse, AlertSeverity } from "@/types/api";
import { useAlertsContext } from "../alerts-context";
import { EmptyState, ErrorState, PageHeader } from "../common";
import { SeverityBadge, SeverityIcon } from "../status";

const TYPE_LABEL: Record<AlertItem["type"], string> = {
  BUDGET_BREACH: "Budget",
  COST_SPIKE: "Anomaly",
  IDLE_RESOURCE: "Idle resource",
  FORECAST_OVERRUN: "Forecast",
};

export function AlertsView() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [severity, setSeverity] = useState<"ALL" | AlertSeverity>("ALL");
  const { setUnread, live, refreshAlerts } = useAlertsContext();
  const { data, error, mutate } = useSWR<AlertsResponse>(`/api/alerts?filter=${filter}&severity=${severity}&limit=100`);

  async function update(body: { ids?: string[]; all?: boolean; read: boolean }) {
    try {
      await apiFetch("/api/alerts", { method: "PATCH", json: body });
      const fresh = await mutate();
      if (fresh) setUnread(fresh.unread);
      refreshAlerts();
    } catch {
      toast.error("Could not update alerts");
    }
  }

  return (
    <>
      <PageHeader
        title="Alerts"
        description="Budget breaches, spend anomalies and idle-resource notifications in real time."
        actions={
          <>
            <Badge tone={live ? "success" : "neutral"} className="py-1">
              <Circle className={cn("h-2 w-2 fill-current", live && "animate-pulse")} /> {live ? "Streaming live" : "Reconnecting"}
            </Badge>
            <Button variant="secondary" size="sm" disabled={!data?.unread} onClick={() => update({ all: true, read: true })}>
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition",
              filter === f ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/[0.06]",
            )}
          >
            {f}
            {f === "unread" && data ? ` (${data.unread})` : ""}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-white/10" />
        {(["ALL", "CRITICAL", "WARNING", "INFO"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSeverity(s)}
            aria-pressed={severity === s}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              severity === s ? "bg-zinc-200 text-zinc-900 dark:bg-white/[0.12] dark:text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/[0.06]",
            )}
          >
            {s === "ALL" ? "All severities" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {error ? (
          <ErrorState className="m-6" message={error.message} onRetry={() => mutate()} />
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
            {!data &&
              Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="flex gap-4 p-5">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                </li>
              ))}
            {data?.alerts.map((a) => (
              <li key={a.id} className={cn("flex flex-col gap-3 p-5 transition sm:flex-row sm:items-start", !a.read && "bg-brand-50/40 dark:bg-brand-500/[0.03]")}>
                <div className="flex flex-1 gap-4">
                  <SeverityIcon severity={a.severity} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn("text-sm", a.read ? "font-medium" : "font-semibold")}>{a.title}</p>
                      <SeverityBadge severity={a.severity} />
                      <Badge>{TYPE_LABEL[a.type]}</Badge>
                      {!a.read && <span className="h-2 w-2 rounded-full bg-brand-500" aria-label="Unread" />}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{a.message}</p>
                    <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-zinc-500">
                      <span>{formatRelativeTime(a.createdAt)}</span>
                      {a.service && <span>Service: {a.service}</span>}
                      {a.amount !== null && <span>Observed: {formatCurrency(a.amount, { decimals: 2 })}</span>}
                      {a.threshold !== null && <span>Baseline: {formatCurrency(a.threshold, { decimals: 2 })}</span>}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="self-end sm:self-start" onClick={() => update({ ids: [a.id], read: !a.read })}>
                  {a.read ? "Mark unread" : "Mark read"}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {data?.alerts.length === 0 && <EmptyState icon={BellOff} title="No alerts here" body="You're all caught up. New anomalies will stream in automatically." />}
      </Card>
    </>
  );
}
