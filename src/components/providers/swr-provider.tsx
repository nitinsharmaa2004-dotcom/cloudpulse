"use client";

import { SWRConfig } from "swr";
import type { ReactNode } from "react";
import { fetcher } from "@/lib/client";

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false, shouldRetryOnError: (err) => err?.status >= 500, errorRetryCount: 2 }}>
      {children}
    </SWRConfig>
  );
}
