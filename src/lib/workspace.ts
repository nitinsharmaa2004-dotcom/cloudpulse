import { prisma } from "./prisma";
import { generateAlerts, generateCostLogs, generateResources } from "./mock-data";

/** Provisions a demo AWS workspace (cost history, inventory, alerts) for a newly created user. */
export async function provisionDemoWorkspace(userId: string) {
  await prisma.$transaction([
    prisma.costLog.createMany({ data: generateCostLogs(userId) }),
    prisma.cloudResource.createMany({ data: generateResources(userId) }),
    prisma.alert.createMany({ data: generateAlerts(userId) }),
    prisma.cloudConnection.create({
      data: {
        userId,
        provider: "AWS",
        name: "Production (demo)",
        accountId: "123456789012",
        roleArn: "arn:aws:iam::123456789012:role/CloudPulseReadOnly",
        externalId: `cp-${userId.slice(-10)}`,
        region: "us-east-1",
        status: "CONNECTED",
        lastSyncedAt: new Date(),
      },
    }),
  ]);
}
