import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, unread] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.sub }, select: { name: true, email: true, role: true, company: true } }),
    prisma.alert.count({ where: { userId: session.sub, read: false } }),
  ]);
  if (!user) redirect("/api/auth/logout");

  return (
    <DashboardShell user={user} initialUnread={unread}>
      {children}
    </DashboardShell>
  );
}
