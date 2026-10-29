import { prisma } from "@/lib/prisma";
import { ApiError, ok, requireRole, withAuth } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withAuth<Ctx>(async (_req, { params, session }) => {
  requireRole(session, ["OWNER", "ADMIN"]);
  const { id } = await params;
  const resource = await prisma.cloudResource.findFirst({ where: { id, userId: session.sub } });
  if (!resource) throw new ApiError(404, "NOT_FOUND", "Resource not found");
  if (resource.status === "STOPPED") throw new ApiError(409, "ALREADY_OPTIMIZED", "This resource has already been optimized");
  if (resource.estimatedSavings <= 0) throw new ApiError(422, "NOTHING_TO_OPTIMIZE", "No optimization available for this resource");

  const updated = await prisma.cloudResource.update({
    where: { id },
    data: {
      status: "STOPPED",
      monthlyCost: Math.max(0, Math.round((resource.monthlyCost - resource.estimatedSavings) * 100) / 100),
      recommendation: `Optimization applied · saving $${resource.estimatedSavings.toFixed(2)}/mo`,
      estimatedSavings: 0,
    },
  });
  return ok({ resource: updated, saved: resource.estimatedSavings });
});
