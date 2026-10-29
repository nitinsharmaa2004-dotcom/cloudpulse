import type { AlertSeverity, AlertType, Prisma, ResourceStatus } from "@prisma/client";
import { SERVICES, type ServiceName } from "./constants";

/** Deterministic PRNG so every workspace gets stable, realistic demo data. */
export function createRng(seedInput: string) {
  let seed = 0;
  for (let i = 0; i < seedInput.length; i++) seed = (Math.imul(31, seed) + seedInput.charCodeAt(i)) | 0;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

const BASE_DAILY: Record<ServiceName, number> = {
  EC2: 372,
  RDS: 186,
  S3: 84,
  CloudWatch: 38,
  ALB: 52,
  "NAT Gateway": 68,
};

export const COST_HISTORY_DAYS = 180;

export function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function generateCostLogs(userId: string, days = COST_HISTORY_DAYS): Prisma.CostLogCreateManyInput[] {
  const rng = createRng(`${userId}-costs`);
  const today = startOfUtcDay();
  const logs: Prisma.CostLogCreateManyInput[] = [];

  const spikes: Record<number, { service: ServiceName; factor: number }> = {
    2: { service: "CloudWatch", factor: 2.7 },
    11: { service: "EC2", factor: 1.55 },
    37: { service: "NAT Gateway", factor: 2.1 },
    68: { service: "RDS", factor: 1.6 },
  };

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(today.getTime() - offset * 86_400_000);
    const growth = 1 + (days - offset) * 0.0016;
    const weekday = date.getUTCDay();
    const isWeekend = weekday === 0 || weekday === 6;

    for (const service of SERVICES) {
      const seasonal = service === "EC2" || service === "ALB" ? (isWeekend ? 0.86 : 1.04) : 1;
      const noise = 0.92 + rng() * 0.16;
      const spike = spikes[offset]?.service === service ? spikes[offset]!.factor : 1;
      logs.push({
        userId,
        date,
        service,
        region: rng() > 0.72 ? "eu-west-1" : "us-east-1",
        amount: round(BASE_DAILY[service] * growth * seasonal * noise * spike),
      });
    }
  }
  return logs;
}

const EC2_TYPES = [
  { type: "t3.medium", monthly: 30.37, down: "t3.small" },
  { type: "t3.large", monthly: 60.74, down: "t3.medium" },
  { type: "m5.xlarge", monthly: 140.16, down: "m5.large" },
  { type: "m5.2xlarge", monthly: 280.32, down: "m5.xlarge" },
  { type: "c5.4xlarge", monthly: 496.4, down: "c5.2xlarge" },
  { type: "r5.2xlarge", monthly: 367.92, down: "r5.xlarge" },
];

const hex = (rng: () => number, len: number) =>
  Array.from({ length: len }, () => Math.floor(rng() * 16).toString(16)).join("");

type ResourceDraft = Omit<Prisma.CloudResourceCreateManyInput, "userId">;

export function evaluateResource(
  r: Pick<ResourceDraft, "service" | "cpuUtilization" | "networkGb" | "monthlyCost" | "instanceType">,
): { status: ResourceStatus; estimatedSavings: number; recommendation: string | null } {
  const cost = r.monthlyCost;
  switch (r.service) {
    case "EC2": {
      if (r.cpuUtilization < 3) return { status: "IDLE", estimatedSavings: round(cost * 0.95), recommendation: "Instance idle for 14+ days. Stop or terminate." };
      if (r.cpuUtilization < 20) {
        const down = EC2_TYPES.find((t) => t.type === r.instanceType)?.down ?? "a smaller size";
        return { status: "UNDERUTILIZED", estimatedSavings: round(cost * 0.5), recommendation: `Rightsize to ${down} (avg CPU ${r.cpuUtilization.toFixed(1)}%).` };
      }
      return { status: "RUNNING", estimatedSavings: round(cost * 0.28), recommendation: "Cover with a 1-yr Compute Savings Plan." };
    }
    case "NAT Gateway":
      if ((r.networkGb ?? 0) < 1) return { status: "IDLE", estimatedSavings: round(cost), recommendation: "No traffic in 7 days. Delete NAT Gateway." };
      if ((r.networkGb ?? 0) > 1500) return { status: "UNDERUTILIZED", estimatedSavings: round(cost * 0.35), recommendation: "Add S3/DynamoDB VPC gateway endpoints to cut data processing." };
      return { status: "RUNNING", estimatedSavings: 0, recommendation: null };
    case "EBS":
      if (r.cpuUtilization === 0) return { status: "IDLE", estimatedSavings: round(cost), recommendation: "Unattached volume. Snapshot and delete." };
      if (r.instanceType.startsWith("gp2")) return { status: "UNDERUTILIZED", estimatedSavings: round(cost * 0.2), recommendation: "Migrate gp2 → gp3 for 20% lower cost." };
      return { status: "RUNNING", estimatedSavings: 0, recommendation: null };
    case "RDS":
      if (r.cpuUtilization < 10) return { status: "UNDERUTILIZED", estimatedSavings: round(cost * 0.45), recommendation: "Downsize instance class or switch to Aurora Serverless v2." };
      return { status: "RUNNING", estimatedSavings: round(cost * 0.3), recommendation: "Purchase Reserved Instance (1-yr, no upfront)." };
    case "ALB":
      if ((r.networkGb ?? 0) < 0.5) return { status: "IDLE", estimatedSavings: round(cost), recommendation: "No healthy targets or traffic. Remove load balancer." };
      return { status: "RUNNING", estimatedSavings: 0, recommendation: null };
    case "S3":
      if (r.cpuUtilization < 5) return { status: "UNDERUTILIZED", estimatedSavings: round(cost * 0.4), recommendation: "Rarely accessed. Add lifecycle rule to Glacier Instant Retrieval." };
      return { status: "RUNNING", estimatedSavings: round(cost * 0.1), recommendation: "Enable S3 Intelligent-Tiering." };
    default:
      return { status: "RUNNING", estimatedSavings: 0, recommendation: null };
  }
}

export function generateResources(userId: string): Prisma.CloudResourceCreateManyInput[] {
  const rng = createRng(`${userId}-resources`);
  const now = Date.now();
  const regions = ["us-east-1", "us-east-1", "us-west-2", "eu-west-1", "ap-south-1"];
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rng() * arr.length)]!;
  const drafts: ResourceDraft[] = [];

  const ec2Names = ["api-gateway-prod", "worker-queue-01", "ml-training-node", "legacy-billing", "staging-web", "jenkins-agent", "analytics-batch", "dev-sandbox-nitin", "grafana-host", "search-indexer", "bastion-host", "etl-runner"];
  const cpuProfile = [64, 41, 1.2, 0.8, 12, 2.1, 7.4, 0.4, 18, 55, 4.2, 36];
  ec2Names.forEach((name, i) => {
    const t = EC2_TYPES[i % EC2_TYPES.length]!;
    drafts.push({
      resourceId: `i-0${hex(rng, 16)}`,
      name,
      service: "EC2",
      instanceType: t.type,
      region: pick(regions),
      status: "RUNNING",
      cpuUtilization: round(cpuProfile[i]! + rng() * 2, 1),
      memoryUtilization: round(Math.min(95, cpuProfile[i]! * 1.2 + 10 + rng() * 10), 1),
      networkGb: round(cpuProfile[i]! * 8 + rng() * 20, 1),
      monthlyCost: t.monthly,
      lastActiveAt: new Date(now - (cpuProfile[i]! < 3 ? 16 : 0) * 86_400_000 - rng() * 3_600_000),
    });
  });

  [
    { name: "nat-prod-az-a", gb: 2140 },
    { name: "nat-prod-az-b", gb: 410 },
    { name: "nat-staging", gb: 0.2 },
    { name: "nat-dev-legacy", gb: 0 },
  ].forEach(({ name, gb }) => {
    drafts.push({
      resourceId: `nat-0${hex(rng, 16)}`,
      name,
      service: "NAT Gateway",
      instanceType: "NAT Gateway",
      region: pick(regions),
      status: "RUNNING",
      cpuUtilization: 0,
      networkGb: gb,
      monthlyCost: round(32.85 + gb * 0.045),
      lastActiveAt: new Date(now - (gb < 1 ? 9 : 0) * 86_400_000),
    });
  });

  [
    { name: "vol-db-backup-old", type: "gp2 · 500 GiB", attached: false, cost: 50 },
    { name: "vol-ml-scratch", type: "io1 · 1 TiB", attached: false, cost: 189.5 },
    { name: "vol-api-root", type: "gp2 · 200 GiB", attached: true, cost: 20 },
    { name: "vol-postgres-data", type: "gp3 · 2 TiB", attached: true, cost: 163.84 },
  ].forEach(({ name, type, attached, cost }) => {
    drafts.push({
      resourceId: `vol-0${hex(rng, 16)}`,
      name,
      service: "EBS",
      instanceType: type,
      region: pick(regions),
      status: "RUNNING",
      cpuUtilization: attached ? round(20 + rng() * 40, 1) : 0,
      networkGb: 0,
      monthlyCost: cost,
      lastActiveAt: new Date(now - (attached ? 0 : 41) * 86_400_000),
    });
  });

  [
    { name: "orders-db-primary", type: "db.r6g.2xlarge", cpu: 46, cost: 829.4 },
    { name: "reporting-replica", type: "db.r6g.xlarge", cpu: 6.3, cost: 414.7 },
    { name: "staging-postgres", type: "db.t3.large", cpu: 3.1, cost: 105.12 },
  ].forEach(({ name, type, cpu, cost }) => {
    drafts.push({
      resourceId: name,
      name,
      service: "RDS",
      instanceType: type,
      region: "us-east-1",
      status: "RUNNING",
      cpuUtilization: cpu,
      memoryUtilization: round(cpu + 25, 1),
      networkGb: round(cpu * 4, 1),
      monthlyCost: cost,
      lastActiveAt: new Date(now),
    });
  });

  [
    { name: "alb-public-api", gb: 820, cost: 46.2 },
    { name: "alb-internal-old", gb: 0.1, cost: 18.4 },
  ].forEach(({ name, gb, cost }) => {
    drafts.push({
      resourceId: `app/${name}/${hex(rng, 16)}`,
      name,
      service: "ALB",
      instanceType: "Application LB",
      region: "us-east-1",
      status: "RUNNING",
      cpuUtilization: 0,
      networkGb: gb,
      monthlyCost: cost,
      lastActiveAt: new Date(now - (gb < 1 ? 22 : 0) * 86_400_000),
    });
  });

  [
    { name: "cp-app-assets", access: 88, cost: 412.3 },
    { name: "cp-logs-archive-2023", access: 1.2, cost: 968.1 },
  ].forEach(({ name, access, cost }) => {
    drafts.push({
      resourceId: `arn:aws:s3:::${name}`,
      name,
      service: "S3",
      instanceType: "Standard",
      region: "us-east-1",
      status: "RUNNING",
      cpuUtilization: access,
      networkGb: round(access * 3, 1),
      monthlyCost: cost,
      lastActiveAt: new Date(now - (access < 5 ? 63 : 0) * 86_400_000),
    });
  });

  return drafts.map((d) => ({ ...d, ...evaluateResource(d), userId }));
}

export type AlertTemplate = {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  service?: string;
  amount?: number;
  threshold?: number;
  minutesAgo: number;
};

export function generateAlerts(userId: string): Prisma.AlertCreateManyInput[] {
  const templates: AlertTemplate[] = [
    { type: "COST_SPIKE", severity: "CRITICAL", title: "CloudWatch spend spiked 168%", message: "Daily CloudWatch cost reached $112.40 vs. 14-day average of $41.90. Likely cause: high-cardinality custom metrics from worker-queue-01.", service: "CloudWatch", amount: 112.4, threshold: 41.9, minutesAgo: 34 },
    { type: "FORECAST_OVERRUN", severity: "WARNING", title: "Forecast exceeds monthly budget", message: "At the current run-rate the projected bill will exceed your monthly budget. Review idle resources to stay on track.", minutesAgo: 95 },
    { type: "IDLE_RESOURCE", severity: "WARNING", title: "2 NAT Gateways have no traffic", message: "nat-staging and nat-dev-legacy processed < 1 GB in 7 days. Deleting them saves ~$66/month.", service: "NAT Gateway", amount: 65.7, minutesAgo: 240 },
    { type: "BUDGET_BREACH", severity: "INFO", title: "80% of EC2 budget consumed", message: "EC2 spend crossed 80% of its allocated monthly budget.", service: "EC2", minutesAgo: 60 * 20 },
    { type: "IDLE_RESOURCE", severity: "INFO", title: "Unattached EBS volumes detected", message: "vol-db-backup-old and vol-ml-scratch have been unattached for 41 days ($239.50/month).", service: "EBS", amount: 239.5, minutesAgo: 60 * 30 },
    { type: "COST_SPIKE", severity: "WARNING", title: "EC2 spend up 55% day-over-day", message: "An autoscaling event on ml-training-node increased EC2 cost to $598.20 for the day.", service: "EC2", amount: 598.2, threshold: 386, minutesAgo: 60 * 24 * 11 },
  ];
  const now = Date.now();
  return templates.map(({ minutesAgo, ...t }, i) => ({
    ...t,
    userId,
    read: i >= 3,
    createdAt: new Date(now - minutesAgo * 60_000),
  }));
}
