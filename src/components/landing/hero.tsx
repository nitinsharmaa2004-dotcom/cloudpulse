import Link from "next/link";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { ProductPreview } from "./product-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pt-40">
      <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" aria-hidden />
      <div className="absolute left-1/2 top-0 -z-10 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-[120px] dark:bg-brand-500/15" aria-hidden />
      <div className="container text-center">
        <a
          href="#features"
          className="group mx-auto inline-flex animate-fade-up items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-600 backdrop-blur transition hover:border-brand-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
        >
          <Sparkles className="h-3.5 w-3.5 text-brand-500" />
          New: real-time anomaly detection for NAT Gateways
          <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
        </a>
        <h1 className="mx-auto mt-6 max-w-4xl animate-fade-up text-4xl font-semibold tracking-tight [animation-delay:80ms] sm:text-6xl lg:text-7xl">
          <span className="text-gradient">Stop overpaying for</span>
          <br />
          <span className="text-gradient-brand">your cloud.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-base leading-relaxed text-zinc-600 [animation-delay:160ms] dark:text-zinc-400 sm:text-lg">
          CloudPulse monitors your AWS spend in real time, detects idle EC2 instances, NAT Gateways and orphaned volumes, and tells your
          DevOps team exactly what to fix — before the invoice arrives.
        </p>
        <div className="mt-9 flex animate-fade-up flex-col items-center justify-center gap-3 [animation-delay:240ms] sm:flex-row">
          <Link href="/signup" className={buttonClasses("brand", "lg", "w-full sm:w-auto")}>
            Start 14-day free trial <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login?demo=1" className={buttonClasses("secondary", "lg", "w-full sm:w-auto")}>
            <PlayCircle className="h-4 w-4" /> Explore live demo
          </Link>
        </div>
        <p className="mt-4 animate-fade-up text-xs text-zinc-500 [animation-delay:300ms]">No credit card required · Read-only IAM access · SOC 2 Type II</p>
      </div>
      <div className="container mt-16 animate-fade-up [animation-delay:380ms] sm:mt-20">
        <ProductPreview />
      </div>
      <div className="container mt-16">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Trusted by platform teams at</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-lg font-semibold tracking-tight text-zinc-400 dark:text-zinc-600">
          {["Northwind", "Lumen Labs", "Stackwise", "Orbital", "Quanta", "Helios Pay"].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
