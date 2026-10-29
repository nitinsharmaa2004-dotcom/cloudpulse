import { cn } from "@/lib/utils";

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden
      style={style}
      className={cn(
        "relative overflow-hidden rounded-md bg-zinc-200/70 dark:bg-white/[0.06]",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent dark:before:via-white/[0.06]",
        className,
      )}
    />
  );
}
