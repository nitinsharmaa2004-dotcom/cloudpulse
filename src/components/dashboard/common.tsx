"use client";

import type { ReactNode } from "react";
import { AlertCircle, ArrowDownRight, ArrowUpRight, RefreshCw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function TrendPill({ value, inverse = true, suffix = "%" }: { value: number; inverse?: boolean; suffix?: string }) {
  // For costs, an increase is "bad" (inverse = true).
  const up = value > 0;
  const bad = inverse ? up : !up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
        value === 0
          ? "bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-zinc-400"
          : bad
            ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
      )}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  footer,
  accent = "brand",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  footer?: ReactNode;
  accent?: "brand" | "violet" | "emerald" | "amber";
}) {
  const accents = {
    brand: "from-brand-500/15 text-brand-600 dark:text-brand-400",
    violet: "from-violet-500/15 text-violet-600 dark:text-violet-400",
    emerald: "from-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    amber: "from-amber-500/15 text-amber-600 dark:text-amber-400",
  };
  return (
    <Card className="relative overflow-hidden p-5">
      <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br to-transparent blur-xl", accents[accent])} aria-hidden />
      <div className="relative flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/[0.06]", accents[accent])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="relative mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums">{value}</p>
      {footer && <div className="relative mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">{footer}</div>}
    </Card>
  );
}

export function KpiSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-7 w-32" />
      <Skeleton className="mt-4 h-3 w-40" />
    </Card>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-16 rounded-full" />
        ))}
      </div>
      <div className="mt-4 flex items-end gap-2" style={{ height }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <Skeleton key={i} className="flex-1 rounded-b-none rounded-t-md" style={{ height: `${35 + ((i * 37) % 60)}%` }} />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry, className }: { message?: string; onRetry?: () => void; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-white/10", className)}>
      <AlertCircle className="h-6 w-6 text-rose-500" />
      <p className="mt-3 text-sm font-medium">Couldn&apos;t load this data</p>
      <p className="mt-1 max-w-xs text-xs text-zinc-500">{message ?? "An unexpected error occurred."}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/[0.06]">
        <Icon className="h-5 w-5 text-zinc-500" />
      </span>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-zinc-500">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function RangePicker<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: readonly T[] }) {
  return (
    <div role="radiogroup" aria-label="Time range" className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-white/10 dark:bg-white/[0.03]">
      {options.map((o) => (
        <button
          key={o}
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition",
            value === o ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white",
          )}
        >
          {o.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
