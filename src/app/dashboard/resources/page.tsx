import type { Metadata } from "next";
import { ResourcesView } from "@/components/dashboard/views/resources-view";

export const metadata: Metadata = { title: "Optimization Scanner" };

export default function Page() {
  return <ResourcesView />;
}
