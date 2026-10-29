import { Star } from "lucide-react";
import { initials } from "@/lib/utils";

const testimonials = [
  { quote: "CloudPulse found $41k/year in idle NAT Gateways and forgotten dev instances in the first scan. It paid for itself before lunch.", name: "Priya Raman", role: "Head of Platform, Lumen Labs" },
  { quote: "The anomaly alerts caught a runaway CloudWatch metrics job within minutes. Before CloudPulse we would have found it on the invoice.", name: "Marcus Webb", role: "SRE Lead, Stackwise" },
  { quote: "Finally a FinOps tool our engineers actually open. The UI is fast, clean and every recommendation is actionable.", name: "Elena García", role: "VP Engineering, Helios Pay" },
  { quote: "Read-only IAM onboarding took two minutes. Security signed off the same day — that never happens.", name: "Daniel Okafor", role: "Cloud Security Architect, Orbital" },
  { quote: "We cut our AWS bill by 28% in one quarter by rightsizing RDS and moving cold S3 data to Glacier using CloudPulse suggestions.", name: "Hannah Lee", role: "DevOps Manager, Quanta" },
  { quote: "Forecast vs. budget on day five of the month changed how our finance and engineering teams talk to each other.", name: "Arjun Mehta", role: "CTO, Northwind" },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="scroll-mt-20 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">Customers</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            <span className="text-gradient">Loved by DevOps teams</span>
          </h2>
        </div>
        <div className="mt-14 columns-1 gap-6 sm:columns-2 lg:columns-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="glass mb-6 break-inside-avoid rounded-2xl p-6">
              <div className="flex gap-0.5 text-amber-400" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-xs font-semibold text-white">
                  {initials(t.name)}
                </span>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
