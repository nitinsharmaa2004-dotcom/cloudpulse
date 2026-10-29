"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { ArrowRight, CalendarClock, DollarSign, PiggyBank, RefreshCw, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";
import type { AlertsResponse, CostAnalytics, CostRange, ResourcesResponse, Summary } from "@/types/api";
import { ChartSkeleton, ErrorState, KpiCard, KpiSkeleton, PageHeader, RangePicker, TrendPill } from "../common";
import { CostTrendChart } from "../charts/cost-trend-chart";
import { ServiceBreakdownChart } from "../charts/service-breakdown-chart";
import { ServiceShareChart } from "../charts/service-share-chart";
import { ForecastChart } from "../charts/forecast-chart";
import { SeverityIcon, StatusBadge } from "../status";

const RANGES = ["7d", "30d", "90d"] as const satisfies readonly CostRange[];

export function OverviewView() {
  const [range, setRange] = useState<CostRange>("30d");
  const summary = useSWR<Summary>("/api/dashboard/summary", { refreshInterval: 60_000 });
  const costs = useSWR<CostAnalytics>(`/api/costs?range=${range}`, { keepPreviousData: true });
  const resources = useSWR<ResourcesResponse>("/api/resources?status=ALL&sort=savings");
  const alerts = useSWR<AlertsResponse>("/api/alerts?limit=5");

  const s = summary.data;
  const refreshing = summary.isValidating || costs.isValidating;

  return (
    <>
      <PageHeader
        title="Cost overview"
        description="Real-time view of your AWS spend, forecast and savings opportunities."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void summary.mutate();
              void costs.mutate();
              void resources.mutate();
              void alerts.mutate();
            }}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} /> Refresh
          </Button>
        }
      />

      {summary.error ? (
        <ErrorState message={summary.error.message} onRetry={() => summary.mutate()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {!s ? (
            Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          ) : (
            <>
              <KpiCard
                label="Month-to-date spend"
                value={formatCurrency(s.monthToDate)}
                icon={DollarSign}
                footer={
                  <>
                    <TrendPill value={s.momChange} /> vs. same period last month
                  </>
                }
              />
              <KpiCard
                label="Last month total"
                value={formatCurrency(s.lastMonthTotal)}
                icon={CalendarClock}
                accent="violet"
                footer={<>Daily run-rate {formatCurrency(s.dailyRunRate)}</>}
              />
              <KpiCard
                label="Projected bill"
                value={formatCurrency(s.forecast)}
                icon={TrendingUp}
                accent="amber"
                footer={
                  <>
                    <TrendPill value={s.forecastVsLastMonth} /> vs. last month
                  </>
                }
              />
              <KpiCard
                label="Potential savings"
                value={`${formatCurrency(s.potentialSavings)}/mo`}
                icon={PiggyBank}
                accent="emerald"
                footer={
                  <>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{s.idleResources} resources</span> flagged for action
                  </>
                }
              />
            </>
          )}
        </div>
      )}

      <div className="mt-4">
        {s ? <BudgetBar summary={s} /> : !summary.error && <Skeleton className="h-[92px] rounded-2xl" />}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Daily cost by service</CardTitle>
              <CardDescription>Stacked spend across your top AWS services. Click a service to toggle it.</CardDescription>
            </div>
            <RangePicker value={range} onChange={setRange} options={RANGES} />
          </CardHeader>
          <CardContent>
            {costs.error ? <ErrorState message={costs.error.message} onRetry={() => costs.mutate()} /> : costs.data ? <CostTrendChart data={costs.data.daily} /> : <ChartSkeleton />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Spend distribution</CardTitle>
              <CardDescription>Share by service · last {range}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {costs.data ? (
              <ServiceShareChart data={costs.data.breakdown} />
            ) : costs.error ? (
              <ErrorState onRetry={() => costs.mutate()} />
            ) : (
              <div className="flex flex-col items-center gap-6">
                <Skeleton className="h-48 w-48 rounded-full" />
                <div className="w-full space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Monthly breakdown & growth</CardTitle>
              <CardDescription>Spend per service (left axis) vs. month-over-month growth (right axis)</CardDescription>
            </div>
          </CardHeader>
          <CardContent>{costs.data ? <ServiceBreakdownChart data={costs.data.monthly} /> : <ChartSkeleton height={320} />}</CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Bill forecast</CardTitle>
              <CardDescription>Cumulative actual vs. projected spend against budget pace</CardDescription>
            </div>
            {s && (
              <span className={cn("text-xs font-medium", s.forecastBudgetPct > 100 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
                {s.forecastBudgetPct}% of budget
              </span>
            )}
          </CardHeader>
          <CardContent>{costs.data ? <ForecastChart data={costs.data.forecast} height={320} /> : <ChartSkeleton height={320} />}</CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Top optimization opportunities</CardTitle>
              <CardDescription>Highest-impact actions from the latest resource scan</CardDescription>
            </div>
            <Link href="/dashboard/resources" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
              Open scanner <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-0 sm:px-0">
            <ul className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
              {!resources.data &&
                Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-4 px-5 py-3.5 sm:px-6">
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-16" />
                  </li>
                ))}
              {resources.data?.resources
                .filter((r) => r.status === "IDLE" || r.status === "UNDERUTILIZED")
                .slice(0, 5)
                .map((r) => (
                  <li key={r.id} className="flex items-center gap-4 px-5 py-3.5 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{r.name}</p>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {r.service} · {r.instanceType} · {r.recommendation}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">-{formatCurrency(r.estimatedSavings)}/mo</p>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Recent alerts</CardTitle>
              <CardDescription>Budget breaches & anomaly detection</CardDescription>
            </div>
            <Link href="/dashboard/alerts" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {!alerts.data &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            {alerts.data?.alerts.map((a) => (
              <div key={a.id} className="flex gap-3">
                <SeverityIcon severity={a.severity} />
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm", !a.read && "font-semibold")}>{a.title}</p>
                  <p className="text-xs text-zinc-500">
                    {a.service ?? "Account"} · {formatRelativeTime(a.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function BudgetBar({ summary: s }: { summary: Summary }) {
  const used = Math.min(100, s.budgetUsedPct);
  const forecast = Math.min(100, s.forecastBudgetPct);
  const over = s.forecastBudgetPct > 100;
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-medium">
          Monthly budget <span className="text-zinc-500">· day {s.dayOfMonth} of {s.daysInMonth}</span>
        </p>
        <p className="tabular-nums text-zinc-500">
          <span className="font-semibold text-zinc-900 dark:text-white">{formatCurrency(s.monthToDate)}</span> of {formatCurrency(s.budget)} ({s.budgetUsedPct}%)
        </p>
      </div>
      <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]" role="progressbar" aria-valuenow={s.budgetUsedPct} aria-valuemin={0} aria-valuemax={100} aria-label="Budget used">
        <div className={cn("absolute inset-y-0 left-0 rounded-full opacity-30", over ? "bg-rose-500" : "bg-violet-500")} style={{ width: `${forecast}%` }} />
        <div className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", over ? "from-amber-500 to-rose-500" : "from-brand-500 to-violet-500")} style={{ width: `${used}%` }} />
      </div>
      <p className={cn("mt-2 text-xs", over ? "text-rose-600 dark:text-rose-400" : "text-zinc-500")}>
        {over
          ? `Forecast of ${formatCurrency(s.forecast)} exceeds budget by ${formatCurrency(s.forecast - s.budget)}. Act on flagged resources to stay on track.`
          : `On track — forecast is ${formatCurrency(s.budget - s.forecast)} under budget.`}
      </p>
    </Card>
  );
}
