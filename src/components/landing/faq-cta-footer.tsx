import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const faqs = [
  { q: "What access does CloudPulse need to my AWS account?", a: "A read-only cross-account IAM role secured with an External ID. CloudPulse reads Cost Explorer, CloudWatch metrics and resource metadata — it never modifies your infrastructure." },
  { q: "How quickly will I see data?", a: "Historical cost data for the last 180 days is imported within minutes of connecting. Utilisation scans run continuously after that." },
  { q: "Do you support GCP and Azure?", a: "AWS is fully supported today. GCP and Azure are available on the Enterprise plan." },
  { q: "Can I cancel anytime?", a: "Yes. Plans are month-to-month unless you choose annual billing, and you can export all of your data at any time." },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 py-24">
      <div className="container max-w-3xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          <span className="text-gradient">Frequently asked questions</span>
        </h2>
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="glass group rounded-xl p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {f.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CallToAction() {
  return (
    <section className="py-24">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-zinc-900 px-6 py-16 text-center dark:bg-white/[0.04] dark:ring-1 dark:ring-white/10 sm:px-16">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl" aria-hidden />
          <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" aria-hidden />
          <h2 className="relative text-3xl font-semibold tracking-tight text-white sm:text-5xl">Find your first $10k in savings today</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-zinc-300">Connect a read-only AWS role in under two minutes and get a full optimization report instantly.</p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className={buttonClasses("brand", "lg")}>
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login?demo=1" className={buttonClasses("secondary", "lg", "border-white/15 bg-white/5 text-white hover:bg-white/10 dark:bg-white/5")}>
              View live demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const footerLinks = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Company: ["About", "Customers", "Careers", "Contact"],
  Resources: ["Documentation", "API reference", "FinOps guide", "Status"],
  Legal: ["Privacy", "Terms", "Security", "DPA"],
};

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-14 dark:border-white/[0.06]">
      <div className="container grid gap-10 md:grid-cols-6">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-zinc-500">Cloud infrastructure & cost optimization for modern DevOps teams.</p>
        </div>
        {Object.entries(footerLinks).map(([group, items]) => (
          <div key={group}>
            <p className="text-sm font-semibold">{group}</p>
            <ul className="mt-3 space-y-2">
              {items.map((i) => (
                <li key={i}>
                  <a href="#" className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-white">
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container mt-12 flex flex-col items-center justify-between gap-3 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-white/[0.06] sm:flex-row">
        <p>© {new Date().getFullYear()} CloudPulse, Inc. All rights reserved.</p>
        <p className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-400" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          All systems operational
        </p>
      </div>
    </footer>
  );
}
