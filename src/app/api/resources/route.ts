import type { Prisma, ResourceStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, withAuth } from "@/lib/api";

const querySchema = z.object({
  status: z.enum(["ALL", "RUNNING", "IDLE", "UNDERUTILIZED", "STOPPED"]).default("ALL"),
  service: z.string().max(40).default("ALL"),
  q: z.string().trim().max(100).default(""),
  sort: z.enum(["savings", "cost", "cpu", "name"]).default("savings"),
});

export const GET = withAuth(async (req, { session }) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const { status, service, q, sort } = querySchema.parse(params);

  const where: Prisma.CloudResourceWhereInput = {
    userId: session.sub,
    ...(status !== "ALL" ? { status: status as ResourceStatus } : {}),
    ...(service !== "ALL" ? { service } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { resourceId: { contains: q, mode: "insensitive" } },
            { instanceType: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.CloudResourceOrderByWithRelationInput =
    sort === "cost" ? { monthlyCost: "desc" } : sort === "cpu" ? { cpuUtilization: "asc" } : sort === "name" ? { name: "asc" } : { estimatedSavings: "desc" };

  const [resources, stats] = await Promise.all([
    prisma.cloudResource.findMany({ where, orderBy }),
    prisma.cloudResource.groupBy({
      by: ["status"],
      where: { userId: session.sub },
      _count: { _all: true },
      _sum: { estimatedSavings: true, monthlyCost: true },
    }),
  ]);

  const summary = {
    total: stats.reduce((a, s) => a + s._count._all, 0),
    idle: stats.find((s) => s.status === "IDLE")?._count._all ?? 0,
    underutilized: stats.find((s) => s.status === "UNDERUTILIZED")?._count._all ?? 0,
    monthlyCost: stats.filter((s) => s.status !== "STOPPED").reduce((a, s) => a + (s._sum.monthlyCost ?? 0), 0),
    potentialSavings: stats.filter((s) => s.status !== "STOPPED").reduce((a, s) => a + (s._sum.estimatedSavings ?? 0), 0),
  };

  return ok({ resources, summary });
});
