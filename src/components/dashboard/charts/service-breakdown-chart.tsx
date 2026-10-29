"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SERVICES, SERVICE_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { CostAnalytics } from "@/types/api";
import { ChartTooltip } from "./chart-tooltip";
import { SeriesLegend } from "./series-legend";
import { useHiddenSeries } from "./use-hidden-series";

/** Multi-axis chart: stacked monthly spend per service (left) vs. MoM growth % (right). */
export function ServiceBreakdownChart({ data, height = 320 }: { data: CostAnalytics["monthly"]; height?: number }) {
  const { hidden, toggle } = useHiddenSeries();
  const visible = SERVICES.filter((s) => !hidden.has(s));
  const lastVisible = visible.at(-1);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SeriesLegend keys={SERVICES} hidden={hidden} onToggle={toggle} />
        <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span className="h-0.5 w-4 rounded bg-zinc-900 dark:bg-white" /> MoM growth (right axis)
        </span>
      </div>
      <div className="mt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 0, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis yAxisId="cost" tickFormatter={(v: number) => formatCurrency(v, { compact: true })} tickLine={false} axisLine={false} width={56} />
            <YAxis yAxisId="growth" orientation="right" tickFormatter={(v: number) => `${v}%`} tickLine={false} axisLine={false} width={44} />
            <Tooltip content={<ChartTooltip showTotal />} cursor={{ fill: "rgba(120,120,140,0.08)" }} />
            {SERVICES.map((s) => (
              <Bar
                key={s}
                yAxisId="cost"
                dataKey={s}
                name={s}
                stackId="svc"
                fill={SERVICE_COLORS[s]}
                hide={hidden.has(s)}
                radius={s === lastVisible ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                maxBarSize={56}
                animationDuration={600}
              />
            ))}
            <Line
              yAxisId="growth"
              type="monotone"
              dataKey="growth"
              name="MoM growth"
              stroke="currentColor"
              className="text-zinc-900 dark:text-white"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 2, fill: "var(--dot-fill, #fff)" }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
