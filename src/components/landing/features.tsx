"use client";

import { useState } from "react";
import { BellRing, Gauge, LineChart, Lock, ScanSearch, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: LineChart,
    title: "Cost analytics",
    body: "Daily, monthly and per-service breakdowns across EC2, S3, RDS, CloudWatch, ALB and NAT Gateways with month-over-month trends.",
    stat: "180 days",
    statLabel: "of granular history",
  },
  {
    icon: ScanSearch,
    title: "Idle resource scanner",
    body: "Continuously flags idle instances, unattached EBS volumes, zero-traffic NAT Gateways and over-provisioned databases.",
    stat: "31%",
    statLabel: "average bill reduction",
  },
  {
    icon: BellRing,
    title: "Real-time alerts",
    body: "Z-score anomaly detection catches spend spikes within minutes. Budget breach and forecast overrun alerts keep finance in the loop.",
    stat: "< 5 min",
    statLabel: "mean time to detect",
  },
  {
    icon: Gauge,
    title: "Forecasting",
    body: "Run-rate projections against your budget so you know on day 5 whether the month will close over or under target.",
    stat: "±3%",
    statLabel: "forecast accuracy",
  },
  {
    icon: Lock,
    title: "Secure by design",
    body: "Read-only cross-account IAM roles with External ID. We never store long-lived credentials or touch your workloads.",
    stat: "0",
    statLabel: "write permissions required",
  },
  {
    icon: Workflow,
    title: "Role-based access",
    body: "Owner, Admin, Member and Viewer roles let engineering, finance and leadership see exactly what they need.",
    stat: "4 roles",
    statLabel: "fine-grained permissions",
  },
];

export function Features() {
  const [active, setActive] = useState(0);
  const current = features[active]!;

  return (
    <section id="features" className="scroll-mt-20 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">Everything FinOps, nothing you don&apos;t need</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            <span className="text-gradient">Built for engineers who own the bill</span>
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">From a single dashboard to automated savings — CloudPulse gives DevOps teams the visibility finance always wanted.</p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-3">
            {features.map((f, i) => (
              <button
                key={f.title}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className={cn(
                  "glass group rounded-2xl p-5 text-left transition-all duration-200",
                  active === i ? "border-brand-300 ring-4 ring-brand-500/10 dark:border-brand-500/40" : "hover:-translate-y-0.5",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition",
                    active === i ? "bg-brand-500 text-white" : "bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-zinc-300",
                  )}
                >
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.body}</p>
              </button>
            ))}
          </div>
          <div className="glass relative flex flex-col justify-between overflow-hidden rounded-2xl p-8 lg:col-span-2">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" aria-hidden />
            <div key={active} className="relative animate-fade-up">
              <current.icon className="h-8 w-8 text-brand-500" />
              <h3 className="mt-6 text-2xl font-semibold tracking-tight">{current.title}</h3>
              <p className="mt-3 leading-relaxed text-zinc-600 dark:text-zinc-400">{current.body}</p>
            </div>
            <div key={`s-${active}`} className="relative mt-10 animate-fade-up border-t border-zinc-200 pt-6 dark:border-white/10">
              <p className="text-gradient-brand text-5xl font-semibold tracking-tight">{current.stat}</p>
              <p className="mt-1 text-sm text-zinc-500">{current.statLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
