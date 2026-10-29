"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white/70 text-zinc-600 transition hover:text-zinc-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:text-white",
        className,
      )}
    >
      <Sun className={cn("h-4 w-4 transition-all", isDark ? "scale-0 -rotate-90" : "scale-100 rotate-0")} />
      <Moon className={cn("absolute h-4 w-4 transition-all", isDark ? "scale-100 rotate-0" : "scale-0 rotate-90")} />
    </button>
  );
}
