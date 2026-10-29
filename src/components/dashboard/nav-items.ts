import { Bell, LayoutDashboard, LineChart, ScanSearch, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/analytics", label: "Cost Analytics", icon: LineChart },
  { href: "/dashboard/resources", label: "Optimization", icon: ScanSearch },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;
