"use client";

import { useDeferredValue, useState } from "react";
import useSWR from "swr";
import { Cpu, Database, HardDrive, Network, PiggyBank, Radar, Scale, Search, Server, Wand2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ClientApiError } from "@/lib/client";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";
import type { Resource, ResourcesResponse, ResourceStatus } from "@/types/api";
import { EmptyState, ErrorState, KpiCard, KpiSkeleton, PageHeader } from "../common";
import { StatusBadge } from "../status";

const SERVICE_ICONS: Record<string, LucideIcon> = { EC2: Cpu, RDS: Database, EBS: HardDrive, "NAT Gateway": Network, ALB: Scale, S3: Server };
const STATUS_FILTERS: { value: "ALL" | ResourceStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "IDLE", label: "Idle" },
  { value: "UNDERUTILIZED", label: "Underutilized" },
  { value: "RUNNING", label: "Healthy" },
  { value: "STOPPED", label: "Optimized" },
];

function UtilBar({ value, service }: { value: number; service: string }) {
  if (service === "NAT Gateway" || service === "ALB") return <span className="text-xs tabular-nums text-zinc-500">—</span>;
  const tone = value < 5 ? "bg-rose-500" : value < 20 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
      </div>
      <span className="w-11 text-xs tabular-nums text-zinc-500">{value.toFixed(1)}%</span>
    </div>
  );
}

export function ResourcesView() {
  const [status, setStatus] = useState<"ALL" | ResourceStatus>("ALL");
  const [service, setService] = useState("ALL");
  const [sort, setSort] = useState("savings");
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query.trim());
  const [scanning, setScanning] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const key = `/api/resources?${new URLSearchParams({ status, service, sort, q })}`;
  const { data, error, isLoading, mutate } = useSWR<ResourcesResponse>(key, { keepPreviousData: true });

  async function runScan() {
    setScanning(true);
    try {
      const res = await apiFetch<{ scanned: number; flagged: number }>("/api/resources/scan", { method: "POST" });
      await mutate();
      toast.success(`Scan complete: ${res.scanned} resources analysed, ${res.flagged} flagged.`);
    } catch (e) {
      toast.error(e instanceof ClientApiError ? e.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function optimize(r: Resource) {
    setPending(r.id);
    try {
      const res = await apiFetch<{ saved: number }>(`/api/resources/${r.id}/optimize`, { method: "POST" });
      await mutate();
      toast.success(`${r.name} optimized — saving ${formatCurrency(res.saved, { decimals: 2 })}/month.`);
    } catch (e) {
      toast.error(e instanceof ClientApiError ? e.message : "Could not apply optimization");
    } finally {
      setPending(null);
    }
  }

  const summary = data?.summary;

  return (
    <>
      <PageHeader
        title="Resource optimization scanner"
        description="Idle EC2 instances, NAT Gateways, unattached volumes and over-provisioned databases."
        actions={
          <Button variant="brand" size="sm" onClick={runScan} loading={scanning}>
            {!scanning && <Radar className="h-3.5 w-3.5" />} {scanning ? "Scanning…" : "Run scan"}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!summary ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard label="Resources tracked" value={String(summary.total)} icon={Server} footer={<>across all connected accounts</>} />
            <KpiCard label="Idle" value={String(summary.idle)} icon={Radar} accent="amber" footer={<>no meaningful activity in 7+ days</>} />
            <KpiCard label="Underutilized" value={String(summary.underutilized)} icon={Cpu} accent="violet" footer={<>candidates for rightsizing</>} />
            <KpiCard label="Estimated savings" value={`${formatCurrency(summary.potentialSavings)}/mo`} icon={PiggyBank} accent="emerald" footer={<>{formatCurrency(summary.potentialSavings * 12)} annualised</>} />
          </>
        )}
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 dark:border-white/[0.06] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin" role="tablist" aria-label="Filter by status">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                role="tab"
                aria-selected={status === f.value}
                onClick={() => setStatus(f.value)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  status === f.value ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/[0.06]",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <div className="relative col-span-2 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, ID or type" className="h-9 pl-9" aria-label="Search resources" />
            </div>
            <Select value={service} onChange={(e) => setService(e.target.value)} className="h-9 sm:w-36" aria-label="Filter by service">
              <option value="ALL">All services</option>
              {Object.keys(SERVICE_ICONS).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 sm:w-40" aria-label="Sort by">
              <option value="savings">Sort: Savings</option>
              <option value="cost">Sort: Monthly cost</option>
              <option value="cpu">Sort: Utilization</option>
              <option value="name">Sort: Name</option>
            </Select>
          </div>
        </div>

        {error ? (
          <ErrorState className="m-6" message={error.message} onRetry={() => mutate()} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-white/[0.06]">
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Utilization</th>
                  <th className="px-4 py-3 text-right">Monthly cost</th>
                  <th className="px-4 py-3">Recommendation</th>
                  <th className="px-4 py-3 text-right">Est. savings</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className={cn("divide-y divide-zinc-100 dark:divide-white/[0.06]", isLoading && data && "opacity-60")}>
                {!data &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-4">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))}
                {data?.resources.map((r) => {
                  const Icon = SERVICE_ICONS[r.service] ?? Server;
                  const flagged = r.status === "IDLE" || r.status === "UNDERUTILIZED";
                  return (
                    <tr key={r.id} className={cn("transition hover:bg-zinc-50/60 dark:hover:bg-white/[0.02]", r.status === "IDLE" && "bg-rose-50/40 dark:bg-rose-500/[0.03]")}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/[0.06]">
                            <Icon className="h-4 w-4 text-zinc-500" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium" title={r.resourceId}>
                              {r.name}
                            </p>
                            <p className="truncate text-xs text-zinc-500">
                              {r.instanceType} · {r.service} · {r.region}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={r.status} />
                        <p className="mt-1 text-[11px] text-zinc-500">active {formatRelativeTime(r.lastActiveAt)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {r.service === "NAT Gateway" || r.service === "ALB" ? (
                          <span className="text-xs tabular-nums text-zinc-500">{r.networkGb.toLocaleString()} GB / mo</span>
                        ) : (
                          <UtilBar value={r.cpuUtilization} service={r.service} />
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">{formatCurrency(r.monthlyCost, { decimals: 2 })}</td>
                      <td className="max-w-[220px] px-4 py-3.5 text-xs text-zinc-600 dark:text-zinc-400">{r.recommendation ?? "No action needed"}</td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {r.estimatedSavings > 0 ? formatCurrency(r.estimatedSavings, { decimals: 2 }) : <span className="font-normal text-zinc-400">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {r.status !== "STOPPED" && r.estimatedSavings > 0 && (
                          <Button size="sm" variant={flagged ? "primary" : "secondary"} loading={pending === r.id} onClick={() => optimize(r)}>
                            {pending !== r.id && <Wand2 className="h-3.5 w-3.5" />} Apply
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {data?.resources.length === 0 && <EmptyState icon={Search} title="No resources match your filters" body="Try a different status, service or search term." />}
          </div>
        )}
      </Card>
    </>
  );
}
