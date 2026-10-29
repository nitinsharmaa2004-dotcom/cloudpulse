import { BadgeCheck, ShieldCheck, TrendingDown } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const points = [
  { icon: TrendingDown, title: "Cut cloud spend by up to 31%", body: "Automatic detection of idle and over-provisioned resources." },
  { icon: ShieldCheck, title: "Read-only & secure", body: "Cross-account IAM role with External ID. No write access, ever." },
  { icon: BadgeCheck, title: "Set up in 2 minutes", body: "180 days of cost history imported instantly after connecting." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm animate-fade-up">{children}</div>
        </main>
        <p className="text-center text-xs text-zinc-500">© {new Date().getFullYear()} CloudPulse, Inc.</p>
      </div>
      <aside className="relative hidden overflow-hidden border-l border-zinc-200 bg-zinc-950 lg:flex lg:flex-col lg:justify-center lg:p-16 dark:border-white/[0.06]">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" aria-hidden />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" aria-hidden />
        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white">
            Your cloud bill, <span className="text-gradient-brand">finally under control.</span>
          </h2>
          <ul className="mt-10 space-y-6">
            {points.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <p.icon className="h-5 w-5 text-brand-300" />
                </span>
                <div>
                  <p className="font-medium text-white">{p.title}</p>
                  <p className="mt-0.5 text-sm text-zinc-400">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <figure className="mt-12 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <blockquote className="text-sm leading-relaxed text-zinc-300">
              &ldquo;CloudPulse found $41k/year in idle NAT Gateways and forgotten dev instances in the very first scan.&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-xs text-zinc-500">Priya Raman · Head of Platform, Lumen Labs</figcaption>
          </figure>
        </div>
      </aside>
    </div>
  );
}
