"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Cpu, Database, HardDrive, Network } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const data = Array.from({ length: 30 }, (_, i) => ({
  d: `Oct ${i + 1}`,
  ec2: 320 + Math.sin(i / 3) * 40 + i * 2.4,
  rds: 170 + Math.cos(i / 4) * 18 + i,
  s3: 80 + Math.sin(i / 2) * 8,
}));

const kpis = [
  { label: "Month-to-date", value: "$18,420", delta: "+6.2%", up: true },
  { label: "Forecast", value: "$24,910", delta: "+3.1%", up: true },
  { label: "Potential savings", value: "$3,284", delta: "18 resources", up: false },
];

const rows = [
  { icon: Cpu, name: "legacy-billing", type: "m5.2xlarge", cpu: "0.9%", save: 266, tag: "Idle" },
  { icon: Network, name: "nat-dev-legacy", type: "NAT Gateway", cpu: "0 GB", save: 33, tag: "Idle" },
  { icon: Database, name: "reporting-replica", type: "db.r6g.xlarge", cpu: "6.3%", save: 187, tag: "Rightsize" },
  { icon: HardDrive, name: "vol-ml-scratch", type: "io1 · 1 TiB", cpu: "detached", save: 190, tag: "Idle" },
];

export function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div className="absolute -inset-x-10 -top-10 bottom-0 -z-10 bg-gradient-to-b from-brand-500/25 via-violet-500/10 to-transparent blur-3xl" aria-hidden />
      <div className="glass overflow-hidden rounded-2xl p-1.5 shadow-2xl shadow-brand-900/10 ring-1 ring-black/5 dark:ring-white/5">
        <div className="flex items-center gap-1.5 px-3 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <div className="mx-auto hidden rounded-md bg-zinc-100 px-24 py-1 font-mono text-[10px] text-zinc-500 dark:bg-white/5 sm:block">app.cloudpulse.dev/dashboard</div>
        </div>
        <div className="grid gap-3 rounded-xl bg-zinc-50/80 p-3 dark:bg-black/40 sm:p-4 lg:grid-cols-3">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border border-zinc-200/80 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{k.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{k.value}</p>
              <p className={`mt-1 inline-flex items-center gap-1 text-xs ${k.up ? "text-rose-500" : "text-emerald-500"}`}>
                {k.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {k.delta}
              </p>
            </div>
          ))}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03] lg:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Daily cost by service</p>
              <div className="flex gap-3 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-brand-500" />EC2</span>
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-amber-500" />RDS</span>
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" />S3</span>
              </div>
            </div>
            <div className="mt-3 h-44 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                  <defs>
                    {[["ec2", "#3b66fb"], ["rds", "#f59e0b"], ["s3", "#10b981"]].map(([k, c]) => (
                      <linearGradient key={k} id={`pv-${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={c} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis dataKey="d" hide />
                  <Tooltip
                    cursor={{ stroke: "rgba(120,120,140,0.3)" }}
                    contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid rgba(120,120,140,0.2)" }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Area type="monotone" dataKey="ec2" name="EC2" stackId="1" stroke="#3b66fb" fill="url(#pv-ec2)" strokeWidth={2} />
                  <Area type="monotone" dataKey="rds" name="RDS" stackId="1" stroke="#f59e0b" fill="url(#pv-rds)" strokeWidth={2} />
                  <Area type="monotone" dataKey="s3" name="S3" stackId="1" stroke="#10b981" fill="url(#pv-s3)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Optimization scanner</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" /> 4 flagged
              </span>
            </div>
            <ul className="mt-3 space-y-2.5">
              {rows.map((r) => (
                <li key={r.name} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5">
                    <r.icon className="h-4 w-4 text-zinc-500" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{r.name}</p>
                    <p className="truncate text-[11px] text-zinc-500">{r.type} · {r.cpu}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">-{formatCurrency(r.save)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
