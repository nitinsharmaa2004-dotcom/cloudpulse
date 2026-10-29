"use client";

import { useState } from "react";
import useSWR from "swr";
import { Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SERVICES, SERVICE_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { CostAnalytics, CostRange, Summary } from "@/types/api";
import { ChartSkeleton, ErrorState, PageHeader, RangePicker, TrendPill } from "../common";
import { CostTrendChart } from "../charts/cost-trend-chart";
import { ServiceBreakdownChart } from "../charts/service-breakdown-chart";
import { ForecastChart } from "../charts/forecast-chart";

const RANGES = ["7d", "30d", "90d", "180d"] as const satisfies readonly CostRange[];

function exportCsv(data: CostAnalytics) {
  const header = ["date", ...SERVICES, "total"];
  const rows = data.daily.map((d) => [d.date, ...SERVICES.map((s) => d[s] ?? 0), d.total].join(","));
  const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cloudpulse-costs-${data.range}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AnalyticsView() {
  const [range, setRange] = useState<CostRange>("90d");
  const costs = useSWR<CostAnalytics>(`/api/costs?range=${range}`, { keepPreviousData: true });
  const summary = useSWR<Summary>("/api/dashboard/summary");
  const total = costs.data?.daily.reduce((a, d) => a + d.total, 0) ?? 0;
  const avg = costs.data?.daily.length ? total / costs.data.daily.length : 0;
  const peak = costs.data?.daily.reduce((m, d) => (d.total > m.total ? d : m), costs.data.daily[0]!);

  return (
    <>
      <PageHeader
        title="Cost analytics"
        description="Drill into spend trends, service breakdowns and forecasts."
        actions={
          <>
            <RangePicker value={range} onChange={setRange} options={RANGES} />
            <Button variant="secondary" size="sm" disabled={!costs.data} onClick={() => costs.data && exportCsv(costs.data)}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </>
        }
      />

      {costs.error ? (
        <ErrorState message={costs.error.message} onRetry={() => costs.mutate()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: `Total spend · ${range}`, value: costs.data ? formatCurrency(total) : null },
              { label: "Average per day", value: costs.data ? formatCurrency(avg) : null },
              { label: "Peak day", value: peak ? `${formatCurrency(peak.total)} · ${new Date(`${peak.date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}` : null },
            ].map((k) => (
              <Card key={k.label} className="p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{k.label}</p>
                {k.value ? <p className="mt-2 text-xl font-semibold tabular-nums">{k.value}</p> : <Skeleton className="mt-3 h-6 w-32" />}
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <div>
                <CardTitle>Daily spend trend</CardTitle>
                <CardDescription>Stacked by service for the selected range</CardDescription>
              </div>
            </CardHeader>
            <CardContent>{costs.data ? <CostTrendChart data={costs.data.daily} height={360} /> : <ChartSkeleton height={360} />}</CardContent>
          </Card>

          <div className="mt-6 grid gap-6 2xl:grid-cols-2">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Monthly cost by service</CardTitle>
                  <CardDescription>Last 6 months · bars = spend, line = MoM growth</CardDescription>
                </div>
              </CardHeader>
              <CardContent>{costs.data ? <ServiceBreakdownChart data={costs.data.monthly} height={340} /> : <ChartSkeleton height={340} />}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Month-end forecast</CardTitle>
                  <CardDescription>Projection based on the trailing 7-day run-rate</CardDescription>
                </div>
              </CardHeader>
              <CardContent>{costs.data ? <ForecastChart data={costs.data.forecast} height={340} /> : <ChartSkeleton height={340} />}</CardContent>
            </Card>
          </div>

          <Card className="mt-6 overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>Service breakdown</CardTitle>
                <CardDescription>Month-to-date vs. the same period last month</CardDescription>
              </div>
            </CardHeader>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-y border-zinc-100 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-white/[0.06]">
                    <th className="px-6 py-3">Service</th>
                    <th className="px-6 py-3 text-right">Month-to-date</th>
                    <th className="px-6 py-3 text-right">Last month (same period)</th>
                    <th className="px-6 py-3 text-right">Change</th>
                    <th className="px-6 py-3">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
                  {!summary.data &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-6 py-3.5">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      </tr>
                    ))}
                  {summary.data?.serviceTotals.map((s) => {
                    const share = summary.data!.monthToDate ? (s.amount / summary.data!.monthToDate) * 100 : 0;
                    return (
                      <tr key={s.service} className="transition hover:bg-zinc-50/60 dark:hover:bg-white/[0.02]">
                        <td className="px-6 py-3.5 font-medium">
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERVICE_COLORS[s.service] }} />
                            {s.service}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right tabular-nums">{formatCurrency(s.amount, { decimals: 2 })}</td>
                        <td className="px-6 py-3.5 text-right tabular-nums text-zinc-500">{formatCurrency(s.previous, { decimals: 2 })}</td>
                        <td className="px-6 py-3.5 text-right">
                          <TrendPill value={s.change} />
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
                              <div className="h-full rounded-full" style={{ width: `${share}%`, background: SERVICE_COLORS[s.service] }} />
                            </div>
                            <span className="text-xs tabular-nums text-zinc-500">{share.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
