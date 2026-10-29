"use client";

import { formatCurrency } from "@/lib/utils";

type Entry = { name?: string | number; value?: number | string | null; color?: string; dataKey?: string | number; payload?: Record<string, unknown> };

export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter = (v, key) => (key === "growth" ? `${v > 0 ? "+" : ""}${v}%` : formatCurrency(v, { decimals: 2 })),
  showTotal,
}: {
  active?: boolean;
  payload?: Entry[];
  label?: string | number;
  labelFormatter?: (label: string | number) => string;
  valueFormatter?: (v: number, key?: string) => string;
  showTotal?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value !== null && p.value !== undefined);
  const total = rows.filter((r) => r.dataKey !== "growth").reduce((a, r) => a + Number(r.value), 0);
  return (
    <div className="min-w-[180px] rounded-xl border border-zinc-200 bg-white/95 p-3 text-xs shadow-xl backdrop-blur dark:border-white/10 dark:bg-zinc-900/95">
      <p className="mb-2 font-medium text-zinc-900 dark:text-white">{labelFormatter && label !== undefined ? labelFormatter(label) : label}</p>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={String(r.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
              {r.name}
            </span>
            <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">{valueFormatter(Number(r.value), String(r.dataKey))}</span>
          </div>
        ))}
      </div>
      {showTotal && rows.length > 1 && (
        <div className="mt-2 flex justify-between border-t border-zinc-100 pt-2 font-semibold dark:border-white/10">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(total, { decimals: 2 })}</span>
        </div>
      )}
    </div>
  );
}
