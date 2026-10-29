"use client";

import { cn } from "@/lib/utils";
import { SERVICE_COLORS } from "@/lib/constants";

export function SeriesLegend({ keys, hidden, onToggle }: { keys: readonly string[]; hidden: Set<string>; onToggle: (k: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Toggle series">
      {keys.map((k) => {
        const off = hidden.has(k);
        return (
          <button
            key={k}
            type="button"
            onClick={() => onToggle(k)}
            aria-pressed={!off}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
              off
                ? "border-zinc-200 text-zinc-400 line-through dark:border-white/10 dark:text-zinc-600"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300",
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: off ? "currentColor" : SERVICE_COLORS[k] }} />
            {k}
          </button>
        );
      })}
    </div>
  );
}
