"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import type { AlertItem } from "@/types/api";

type AlertsCtx = { unread: number; setUnread: (n: number) => void; live: boolean; refreshAlerts: () => void };

const Ctx = createContext<AlertsCtx | null>(null);

export function useAlertsContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAlertsContext must be used inside AlertsProvider");
  return ctx;
}

const isAlertKey = (key: unknown) => typeof key === "string" && (key.startsWith("/api/alerts") || key === "/api/dashboard/summary");

export function AlertsProvider({ initialUnread, children }: { initialUnread: number; children: ReactNode }) {
  const [unread, setUnread] = useState(initialUnread);
  const [live, setLive] = useState(false);
  const { mutate } = useSWRConfig();

  const refreshAlerts = useCallback(() => {
    void mutate(isAlertKey);
  }, [mutate]);

  useEffect(() => {
    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    let disposed = false;

    const connect = () => {
      source = new EventSource("/api/alerts/stream");
      source.addEventListener("ready", () => {
        attempts = 0;
        setLive(true);
      });
      source.addEventListener("alerts", (e) => {
        try {
          const { alerts, unread: count } = JSON.parse((e as MessageEvent).data) as { alerts: AlertItem[]; unread: number };
          setUnread(count);
          for (const a of alerts) {
            const fn = a.severity === "CRITICAL" ? toast.error : a.severity === "WARNING" ? toast.warning : toast.info;
            fn(a.title, { description: a.message.length > 110 ? `${a.message.slice(0, 110)}…` : a.message });
          }
          void mutate(isAlertKey);
        } catch {
          /* ignore malformed event */
        }
      });
      source.onerror = () => {
        setLive(false);
        source?.close();
        if (disposed) return;
        attempts += 1;
        retry = setTimeout(connect, Math.min(30_000, 1_000 * 2 ** attempts));
      };
    };

    connect();
    return () => {
      disposed = true;
      if (retry) clearTimeout(retry);
      source?.close();
    };
  }, [mutate]);

  const value = useMemo(() => ({ unread, setUnread, live, refreshAlerts }), [unread, live, refreshAlerts]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
