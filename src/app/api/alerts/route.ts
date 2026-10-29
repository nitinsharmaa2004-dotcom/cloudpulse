import type { AlertSeverity, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, withAuth } from "@/lib/api";
import { alertUpdateSchema } from "@/lib/validation";

const querySchema = z.object({
  filter: z.enum(["all", "unread"]).default("all"),
  severity: z.enum(["ALL", "CRITICAL", "WARNING", "INFO"]).default("ALL"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const GET = withAuth(async (req, { session }) => {
  const { filter, severity, limit } = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const where: Prisma.AlertWhereInput = {
    userId: session.sub,
    ...(filter === "unread" ? { read: false } : {}),
    ...(severity !== "ALL" ? { severity: severity as AlertSeverity } : {}),
  };
  const [alerts, unread] = await Promise.all([
    prisma.alert.findMany({ where, orderBy: { createdAt: "desc" }, take: limit }),
    prisma.alert.count({ where: { userId: session.sub, read: false } }),
  ]);
  return ok({ alerts, unread });
});

export const PATCH = withAuth(async (req, { session }) => {
  const { ids, all, read } = alertUpdateSchema.parse(await req.json());
  const result = await prisma.alert.updateMany({
    where: { userId: session.sub, ...(all ? {} : { id: { in: ids ?? [] } }) },
    data: { read },
  });
  return ok({ updated: result.count });
});
