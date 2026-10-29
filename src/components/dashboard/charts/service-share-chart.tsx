"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SERVICE_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { ChartTooltip } from "./chart-tooltip";

export function ServiceShareChart({ data }: { data: { service: string; amount: number }[] }) {
  const total = data.reduce((a, d) => a + d.amount, 0);
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col 2xl:flex-row">
      <div className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="amount" nameKey="service" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none" animationDuration={600}>
              {data.map((d) => (
                <Cell key={d.service} fill={SERVICE_COLORS[d.service]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-zinc-500">Total</span>
          <span className="text-lg font-semibold tabular-nums">{formatCurrency(total, { compact: true })}</span>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {data.map((d) => (
          <li key={d.service} className="flex items-center gap-3 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SERVICE_COLORS[d.service] }} />
            <span className="flex-1 text-zinc-600 dark:text-zinc-400">{d.service}</span>
            <span className="font-medium tabular-nums">{formatCurrency(d.amount)}</span>
            <span className="w-12 text-right text-xs tabular-nums text-zinc-500">{total ? ((d.amount / total) * 100).toFixed(1) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
