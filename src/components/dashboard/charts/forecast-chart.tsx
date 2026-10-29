"use client";

import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { CostAnalytics } from "@/types/api";
import { ChartTooltip } from "./chart-tooltip";

export function ForecastChart({ data, height = 260 }: { data: CostAnalytics["forecast"]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="fc-actual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b66fb" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3b66fb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickFormatter={(d: number) => `D${d}`} minTickGap={16} />
          <YAxis tickFormatter={(v: number) => formatCurrency(v, { compact: true })} tickLine={false} axisLine={false} width={56} />
          <Tooltip content={<ChartTooltip labelFormatter={(l) => `Day ${l}`} />} />
          <Area type="monotone" dataKey="actual" name="Actual (cumulative)" stroke="#3b66fb" strokeWidth={2} fill="url(#fc-actual)" connectNulls={false} />
          <Line type="monotone" dataKey="projected" name="Forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="budget" name="Budget pace" stroke="#f43f5e" strokeWidth={1.5} strokeOpacity={0.7} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
