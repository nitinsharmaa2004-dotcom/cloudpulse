import "server-only";
import type { Alert } from "@prisma/client";
import { prisma } from "./prisma";
import { SERVICES } from "./constants";

const MIN_INTERVAL_MS = 75_000;
const MAX_UNREAD = 12;

/**
 * Simulates the streaming billing pipeline: occasionally emits a spike or
 * budget alert so the real-time notification flow can be observed in demo mode.
 */
export async function maybeEmitLiveAlert(userId: string): Promise<Alert | null> {
  if (Math.random() > 0.3) return null;
  const [latest, unread] = await Promise.all([
    prisma.alert.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.alert.count({ where: { userId, read: false } }),
  ]);
  if (unread >= MAX_UNREAD) return null;
  if (latest && Date.now() - latest.createdAt.getTime() < MIN_INTERVAL_MS) return null;

  const service = SERVICES[Math.floor(Math.random() * SERVICES.length)]!;
  const pct = Math.round(45 + Math.random() * 180);
  const baseline = Math.round(40 + Math.random() * 300);
  const amount = Math.round(baseline * (1 + pct / 100) * 100) / 100;
  const spike = Math.random() > 0.35;

  return prisma.alert.create({
    data: spike
      ? {
          userId,
          type: "COST_SPIKE",
          severity: pct > 150 ? "CRITICAL" : "WARNING",
          title: `${service} spend spiked ${pct}%`,
          message: `Hourly ${service} cost is trending at $${amount.toFixed(2)}/day vs. a baseline of $${baseline}/day. Investigate recent deployments or traffic changes.`,
          service,
          amount,
          threshold: baseline,
        }
      : {
          userId,
          type: "BUDGET_BREACH",
          severity: "WARNING",
          title: `${service} crossed 90% of its budget`,
          message: `${service} has consumed 90% of its allocated monthly budget with days still remaining in the billing period.`,
          service,
        },
  });
}
