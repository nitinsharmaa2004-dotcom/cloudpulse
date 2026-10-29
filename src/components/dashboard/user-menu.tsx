"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/client";
import { initials } from "@/lib/utils";
import { ROLE_PERMISSIONS } from "@/lib/constants";
import type { Role } from "@/types/api";

export function UserMenu({ name, email, role }: { name: string; email: string; role: Role }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg p-1 pr-2 transition hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-xs font-semibold text-white">{initials(name)}</span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[140px] truncate text-sm font-medium leading-tight">{name}</span>
          <span className="block text-[11px] leading-tight text-zinc-500">{ROLE_PERMISSIONS[role].label}</span>
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-zinc-400 sm:block" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-60 animate-fade-up overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0d0f15]">
          <div className="border-b border-zinc-100 px-4 py-3 dark:border-white/[0.06]">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-zinc-500">{email}</p>
          </div>
          <div className="p-1">
            <Link role="menuitem" href="/dashboard/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06]">
              <User className="h-4 w-4" /> Profile
            </Link>
            <Link role="menuitem" href="/dashboard/settings#connections" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06]">
              <Settings className="h-4 w-4" /> Cloud connections
            </Link>
            <button role="menuitem" onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
