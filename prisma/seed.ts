import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateAlerts, generateCostLogs, generateResources } from "../src/lib/mock-data";

const prisma = new PrismaClient();

const DEMO = { email: "demo@cloudpulse.dev", password: "Demo@1234", name: "Alex Morgan" };

async function main() {
  await prisma.user.deleteMany({ where: { email: DEMO.email } });
  const user = await prisma.user.create({
    data: {
      email: DEMO.email,
      name: DEMO.name,
      company: "Acme Cloud Inc.",
      jobTitle: "Lead DevOps Engineer",
      role: "OWNER",
      monthlyBudget: 24000,
      passwordHash: await bcrypt.hash(DEMO.password, 12),
    },
  });

  await prisma.costLog.createMany({ data: generateCostLogs(user.id) });
  await prisma.cloudResource.createMany({ data: generateResources(user.id) });
  await prisma.alert.createMany({ data: generateAlerts(user.id) });
  await prisma.cloudConnection.createMany({
    data: [
      { userId: user.id, name: "Production", accountId: "482910374615", roleArn: "arn:aws:iam::482910374615:role/CloudPulseReadOnly", externalId: "cp-prod-7f3a9c21", region: "us-east-1", status: "CONNECTED", lastSyncedAt: new Date() },
      { userId: user.id, name: "Staging", accountId: "730195846201", roleArn: "arn:aws:iam::730195846201:role/CloudPulseReadOnly", externalId: "cp-stg-1b8e4d02", region: "eu-west-1", status: "CONNECTED", lastSyncedAt: new Date(Date.now() - 3_600_000) },
    ],
  });

  console.log(`Seeded demo workspace → ${DEMO.email} / ${DEMO.password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
