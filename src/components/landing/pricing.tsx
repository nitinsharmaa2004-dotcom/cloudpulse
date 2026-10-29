"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tier = {
  name: string;
  monthly: number | null;
  description: string;
  cta: string;
  href: string;
  featured?: boolean;
  features: string[];
};

const tiers: Tier[] = [
  {
    name: "Starter",
    monthly: 0,
    description: "For individuals and side projects getting started with cost visibility.",
    cta: "Start for free",
    href: "/signup?plan=starter",
    features: ["1 AWS account", "Up to $5k monthly spend", "30-day cost history", "Daily idle-resource scan", "Email alerts"],
  },
  {
    name: "Pro",
    monthly: 49,
    description: "For growing DevOps teams that need real-time insight and savings automation.",
    cta: "Start 14-day trial",
    href: "/signup?plan=pro",
    featured: true,
    features: ["Up to 10 AWS accounts", "Up to $250k monthly spend", "180-day cost history", "Real-time anomaly detection", "Slack & webhook alerts", "Role-based access (4 roles)"],
  },
  {
    name: "Enterprise",
    monthly: null,
    description: "For organisations with complex multi-cloud estates and compliance needs.",
    cta: "Contact sales",
    href: "mailto:sales@cloudpulse.dev",
    features: ["Unlimited accounts & spend", "AWS, GCP & Azure", "SSO / SAML & SCIM", "Custom data retention", "Dedicated FinOps advisor", "99.99% uptime SLA"],
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="scroll-mt-20 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            <span className="text-gradient">Pays for itself in week one</span>
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Simple, transparent plans. Teams save 12× their subscription on average.</p>
        </div>

        <div className="mt-10 flex justify-center">
          <div role="radiogroup" aria-label="Billing period" className="glass inline-flex rounded-full p-1">
            {[
              { label: "Monthly", value: false },
              { label: "Annual", value: true },
            ].map((o) => (
              <button
                key={o.label}
                role="radio"
                aria-checked={annual === o.value}
                onClick={() => setAnnual(o.value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition",
                  annual === o.value ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "text-zinc-600 dark:text-zinc-400",
                )}
              >
                {o.label}
                {o.value && <span className="ml-1.5 text-xs text-emerald-500">-20%</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-3">
          {tiers.map((t) => {
            const price = t.monthly === null ? null : annual ? Math.round(t.monthly * 0.8) : t.monthly;
            return (
              <div
                key={t.name}
                className={cn(
                  "glass relative flex flex-col rounded-2xl p-7 transition hover:-translate-y-1",
                  t.featured && "border-brand-400/60 ring-4 ring-brand-500/10 dark:border-brand-500/40 lg:scale-[1.03]",
                )}
              >
                {t.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-500 to-violet-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{t.name}</h3>
                <p className="mt-2 min-h-[40px] text-sm text-zinc-600 dark:text-zinc-400">{t.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  {price === null ? (
                    <span className="text-4xl font-semibold tracking-tight">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-semibold tracking-tight">${price}</span>
                      <span className="text-sm text-zinc-500">/ month</span>
                    </>
                  )}
                </div>
                <p className="mt-1 h-4 text-xs text-zinc-500">{price ? (annual ? `Billed $${price * 12} yearly` : "Billed monthly") : price === 0 ? "Free forever" : ""}</p>
                <Link href={t.href} className={buttonClasses(t.featured ? "brand" : "secondary", "md", "mt-6 w-full")}>
                  {t.cta}
                </Link>
                <ul className="mt-7 space-y-3 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-zinc-700 dark:text-zinc-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
