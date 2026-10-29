"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#testimonials", label: "Customers" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar({ authed }: { authed: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled || open ? "border-b border-zinc-200/70 bg-white/75 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#07080c]/75" : "border-b border-transparent",
      )}
    >
      <nav className="container flex h-16 items-center justify-between" aria-label="Main">
        <Logo />
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              {l.label}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {authed ? (
            <Link href="/dashboard" className={buttonClasses("primary", "md")}>
              Open dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonClasses("ghost", "md")}>
                Sign in
              </Link>
              <Link href="/signup" className={buttonClasses("primary", "md")}>
                Start free trial
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-white/10"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="container animate-fade-up pb-6 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5">
                {l.label}
              </a>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {authed ? (
              <Link href="/dashboard" className={buttonClasses("primary", "md", "col-span-2")}>
                Open dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className={buttonClasses("secondary", "md")}>
                  Sign in
                </Link>
                <Link href="/signup" className={buttonClasses("primary", "md")}>
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
