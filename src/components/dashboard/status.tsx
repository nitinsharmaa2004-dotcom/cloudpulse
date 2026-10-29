import { AlertOctagon, AlertTriangle, Info } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AlertSeverity, ResourceStatus } from "@/types/api";

const statusTone: Record<ResourceStatus, { tone: BadgeTone; label: string }> = {
  RUNNING: { tone: "success", label: "Healthy" },
  IDLE: { tone: "danger", label: "Idle" },
  UNDERUTILIZED: { tone: "warning", label: "Underutilized" },
  STOPPED: { tone: "neutral", label: "Optimized" },
};

export function StatusBadge({ status }: { status: ResourceStatus }) {
  const s = statusTone[status];
  return (
    <Badge tone={s.tone}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </Badge>
  );
}

const severityStyle: Record<AlertSeverity, { icon: typeof Info; cls: string; tone: BadgeTone }> = {
  CRITICAL: { icon: AlertOctagon, cls: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400", tone: "danger" },
  WARNING: { icon: AlertTriangle, cls: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400", tone: "warning" },
  INFO: { icon: Info, cls: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400", tone: "info" },
};

export function SeverityIcon({ severity, className }: { severity: AlertSeverity; className?: string }) {
  const s = severityStyle[severity];
  return (
    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", s.cls, className)}>
      <s.icon className="h-4 w-4" />
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return <Badge tone={severityStyle[severity].tone}>{severity.charAt(0) + severity.slice(1).toLowerCase()}</Badge>;
}
