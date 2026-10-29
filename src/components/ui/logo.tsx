import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 via-violet-500 to-cyan-400 shadow-[0_4px_16px_-4px_rgba(59,102,251,0.7)]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 12h4l3-8 4 16 3-8h4" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight", className)} aria-label="CloudPulse home">
      <LogoMark />
      <span className="text-[17px] text-zinc-900 dark:text-white">CloudPulse</span>
    </Link>
  );
}
