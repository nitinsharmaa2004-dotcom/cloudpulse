import { prisma } from "@/lib/prisma";
import { ApiError, ok, requireRole, withAuth } from "@/lib/api";
import { connectionSchema, ROLE_ARN_REGEX } from "@/lib/validation";

export const GET = withAuth(async (_req, { session }) => {
  const connections = await prisma.cloudConnection.findMany({ where: { userId: session.sub }, orderBy: { createdAt: "desc" } });
  return ok({ connections });
});

export const POST = withAuth(async (req, { session }) => {
  requireRole(session, ["OWNER", "ADMIN"]);
  const input = connectionSchema.parse(await req.json());
  const accountId = input.roleArn.match(ROLE_ARN_REGEX)![1]!;

  const duplicate = await prisma.cloudConnection.findFirst({ where: { userId: session.sub, roleArn: input.roleArn } });
  if (duplicate) throw new ApiError(409, "DUPLICATE_CONNECTION", "This IAM role is already connected");

  // Simulated STS AssumeRole handshake.
  await new Promise((r) => setTimeout(r, 900));

  const connection = await prisma.cloudConnection.create({
    data: {
      userId: session.sub,
      provider: "AWS",
      name: input.name,
      accountId,
      roleArn: input.roleArn,
      externalId: input.externalId,
      accessKeyHint: input.accessKeyId ? `${input.accessKeyId.slice(0, 4)}••••${input.accessKeyId.slice(-4)}` : null,
      region: input.region,
      status: "CONNECTED",
      lastSyncedAt: new Date(),
    },
  });
  return ok({ connection }, { status: 201 });
});
