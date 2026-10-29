import type { getCostAnalytics, getSummary } from "@/lib/analytics";

export type Summary = Awaited<ReturnType<typeof getSummary>>;
export type CostAnalytics = Awaited<ReturnType<typeof getCostAnalytics>>;
export type CostRange = CostAnalytics["range"];

export type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type ResourceStatus = "RUNNING" | "IDLE" | "UNDERUTILIZED" | "STOPPED";
export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";
export type AlertType = "BUDGET_BREACH" | "COST_SPIKE" | "IDLE_RESOURCE" | "FORECAST_OVERRUN";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  company: string | null;
  jobTitle: string | null;
  monthlyBudget: number;
  createdAt: string;
};

export type Resource = {
  id: string;
  resourceId: string;
  name: string;
  service: string;
  instanceType: string;
  region: string;
  status: ResourceStatus;
  cpuUtilization: number;
  memoryUtilization: number | null;
  networkGb: number;
  monthlyCost: number;
  estimatedSavings: number;
  recommendation: string | null;
  lastActiveAt: string;
};

export type ResourcesResponse = {
  resources: Resource[];
  summary: { total: number; idle: number; underutilized: number; monthlyCost: number; potentialSavings: number };
};

export type AlertItem = {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  service: string | null;
  amount: number | null;
  threshold: number | null;
  read: boolean;
  createdAt: string;
};

export type AlertsResponse = { alerts: AlertItem[]; unread: number };

export type Connection = {
  id: string;
  provider: "AWS" | "GCP" | "AZURE";
  name: string;
  accountId: string;
  roleArn: string;
  externalId: string;
  accessKeyHint: string | null;
  region: string;
  status: "CONNECTED" | "PENDING" | "ERROR";
  lastSyncedAt: string | null;
  createdAt: string;
};
