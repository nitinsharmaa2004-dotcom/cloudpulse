export const SESSION_COOKIE = "cp_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export const SERVICES = ["EC2", "S3", "RDS", "CloudWatch", "ALB", "NAT Gateway"] as const;
export type ServiceName = (typeof SERVICES)[number];

export const SERVICE_COLORS: Record<string, string> = {
  EC2: "#3b66fb",
  S3: "#10b981",
  RDS: "#f59e0b",
  CloudWatch: "#ec4899",
  ALB: "#8b5cf6",
  "NAT Gateway": "#06b6d4",
  EBS: "#64748b",
};

export const AWS_REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-2",
  "eu-west-1",
  "eu-central-1",
  "ap-south-1",
  "ap-southeast-1",
  "ap-northeast-1",
] as const;

export const ROLE_PERMISSIONS = {
  OWNER: {
    label: "Owner",
    description: "Full control over the workspace, billing and members.",
    permissions: ["View dashboards", "Manage alerts", "Connect cloud accounts", "Apply optimizations", "Manage billing", "Manage members"],
  },
  ADMIN: {
    label: "Admin",
    description: "Manage cloud connections, alerts and optimizations.",
    permissions: ["View dashboards", "Manage alerts", "Connect cloud accounts", "Apply optimizations"],
  },
  MEMBER: {
    label: "Member",
    description: "Analyse costs and act on alerts.",
    permissions: ["View dashboards", "Manage alerts"],
  },
  VIEWER: {
    label: "Viewer",
    description: "Read-only access to dashboards.",
    permissions: ["View dashboards"],
  },
} as const;

export const ALL_PERMISSIONS = [
  "View dashboards",
  "Manage alerts",
  "Connect cloud accounts",
  "Apply optimizations",
  "Manage billing",
  "Manage members",
] as const;
