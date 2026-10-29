"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SERVICES, SERVICE_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { CostAnalytics } from "@/types/api";
import { ChartTooltip } from "./chart-tooltip";
import { SeriesLegend } from "./series-legend";
import { useHiddenSeries } from "./use-hidden-series";

const fmtDate = (d: string | number) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function CostTrendChart({ data, height = 300 }: { data: CostAnalytics["daily"]; height?: number }) {
  const { hidden, toggle } = useHiddenSeries();
  return (
    <div>
      <SeriesLegend keys={SERVICES} hidden={hidden} onToggle={toggle} />
      <div className="mt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <defs>
              {SERVICES.map((s) => (
                <linearGradient key={s} id={`trend-${s.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERVICE_COLORS[s]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={SERVICE_COLORS[s]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={fmtDate} tickLine={false} axisLine={false} minTickGap={28} />
            <YAxis tickFormatter={(v: number) => formatCurrency(v, { compact: true })} tickLine={false} axisLine={false} width={56} />
            <Tooltip content={<ChartTooltip labelFormatter={(l) => fmtDate(l)} showTotal />} cursor={{ stroke: "rgba(120,120,140,0.35)" }} />
            {SERVICES.map((s) => (
              <Area
                key={s}
                type="monotone"
                dataKey={s}
                name={s}
                stackId="cost"
                hide={hidden.has(s)}
                stroke={SERVICE_COLORS[s]}
                fill={`url(#trend-${s.replace(/\s/g, "")})`}
                strokeWidth={1.75}
                animationDuration={600}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
