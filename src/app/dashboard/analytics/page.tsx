import type { Metadata } from "next";
import { AnalyticsView } from "@/components/dashboard/views/analytics-view";

export const metadata: Metadata = { title: "Cost Analytics" };

export default function Page() {
  return <AnalyticsView />;
}
