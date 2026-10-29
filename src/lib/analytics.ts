import "server-only";
import { prisma } from "./prisma";
import { SERVICES } from "./constants";
import { generateCostLogs, startOfUtcDay } from "./mock-data";

const DAY = 86_400_000;
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Simulated billing ingestion: back-fills any days missing since the last sync. */
export async function ensureFreshCostData(userId: string) {
  const latest = await prisma.costLog.findFirst({ where: { userId }, orderBy: { date: "desc" }, select: { date: true } });
  if (!latest) return;
  const today = startOfUtcDay();
  const missingDays = Math.round((today.getTime() - latest.date.getTime()) / DAY);
  if (missingDays <= 0) return;
  const logs = generateCostLogs(`${userId}-${isoDay(today)}`, Math.min(missingDays, 180)).map((l) => ({ ...l, userId }));
  await prisma.costLog.createMany({ data: logs });
}

type DailyRow = { date: string; total: number } & Record<string, number | string>;

async function loadDaily(userId: string, from: Date) {
  const logs = await prisma.costLog.findMany({
    where: { userId, date: { gte: from } },
    select: { date: true, service: true, amount: true },
    orderBy: { date: "asc" },
  });
  const byDay = new Map<string, DailyRow>();
  for (const log of logs) {
    const key = isoDay(log.date);
    let row = byDay.get(key);
    if (!row) {
      row = { date: key, total: 0 };
      for (const s of SERVICES) row[s] = 0;
      byDay.set(key, row);
    }
    row[log.service] = round(Number(row[log.service] ?? 0) + log.amount);
    row.total = round(row.total + log.amount);
  }
  return [...byDay.values()];
}

export async function getSummary(userId: string) {
  await ensureFreshCostData(userId);
  const today = startOfUtcDay();
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const prevMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  const daysInMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)).getUTCDate();
  const dayOfMonth = today.getUTCDate();

  const [user, daily, savings, idleCount, unreadAlerts, resourceCount] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { monthlyBudget: true } }),
    loadDaily(userId, prevMonthStart),
    prisma.cloudResource.aggregate({ where: { userId, status: { not: "STOPPED" } }, _sum: { estimatedSavings: true } }),
    prisma.cloudResource.count({ where: { userId, status: { in: ["IDLE", "UNDERUTILIZED"] } } }),
    prisma.alert.count({ where: { userId, read: false } }),
    prisma.cloudResource.count({ where: { userId, status: { not: "STOPPED" } } }),
  ]);

  const current = daily.filter((d) => d.date >= isoDay(monthStart));
  const previous = daily.filter((d) => d.date < isoDay(monthStart));
  const sum = (rows: DailyRow[]) => round(rows.reduce((a, r) => a + r.total, 0));

  const monthToDate = sum(current);
  const lastMonthTotal = sum(previous);
  const lastMonthSamePeriod = sum(previous.slice(0, dayOfMonth));
  const momChange = lastMonthSamePeriod ? ((monthToDate - lastMonthSamePeriod) / lastMonthSamePeriod) * 100 : 0;

  const recent = daily.slice(-7);
  const runRate = recent.length ? sum(recent) / recent.length : 0;
  const forecast = round(monthToDate + runRate * (daysInMonth - dayOfMonth));
  const forecastVsLastMonth = lastMonthTotal ? ((forecast - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  const yesterday = daily.at(-2)?.total ?? 0;
  const todaySpend = daily.at(-1)?.total ?? 0;

  const serviceTotals = SERVICES.map((service) => ({
    service,
    amount: round(current.reduce((a, r) => a + Number(r[service] ?? 0), 0)),
    previous: round(previous.slice(0, dayOfMonth).reduce((a, r) => a + Number(r[service] ?? 0), 0)),
  }))
    .map((s) => ({ ...s, change: s.previous ? round(((s.amount - s.previous) / s.previous) * 100, 1) : 0 }))
    .sort((a, b) => b.amount - a.amount);

  return {
    monthToDate,
    lastMonthTotal,
    lastMonthSamePeriod,
    momChange: round(momChange, 1),
    forecast,
    forecastVsLastMonth: round(forecastVsLastMonth, 1),
    budget: user.monthlyBudget,
    budgetUsedPct: round((monthToDate / user.monthlyBudget) * 100, 1),
    forecastBudgetPct: round((forecast / user.monthlyBudget) * 100, 1),
    dailyRunRate: round(runRate),
    todaySpend,
    dayOverDay: yesterday ? round(((todaySpend - yesterday) / yesterday) * 100, 1) : 0,
    potentialSavings: round(savings._sum.estimatedSavings ?? 0),
    idleResources: idleCount,
    activeResources: resourceCount,
    unreadAlerts,
    serviceTotals,
    dayOfMonth,
    daysInMonth,
  };
}

const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90, "180d": 180 } as const;

export async function getCostAnalytics(userId: string, range: keyof typeof RANGE_DAYS) {
  await ensureFreshCostData(userId);
  const today = startOfUtcDay();
  const sixMonthsAgo = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1));
  const allDaily = await loadDaily(userId, sixMonthsAgo);
  const rangeStart = isoDay(new Date(today.getTime() - (RANGE_DAYS[range] - 1) * DAY));
  const daily = allDaily.filter((d) => d.date >= rangeStart);

  const monthMap = new Map<string, DailyRow>();
  for (const row of allDaily) {
    const key = row.date.slice(0, 7);
    let m = monthMap.get(key);
    if (!m) {
      m = { date: key, total: 0 };
      for (const s of SERVICES) m[s] = 0;
      monthMap.set(key, m);
    }
    for (const s of SERVICES) m[s] = round(Number(m[s]) + Number(row[s] ?? 0));
    m.total = round(m.total + row.total);
  }
  const monthly = [...monthMap.values()].map((m, i, arr) => {
    const prev = arr[i - 1];
    const label = new Date(`${m.date}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
    return { ...m, month: label, growth: prev ? round(((m.total - prev.total) / prev.total) * 100, 1) : 0, partial: i === arr.length - 1 };
  });

  const breakdown = SERVICES.map((service) => ({
    service,
    amount: round(daily.reduce((a, r) => a + Number(r[service] ?? 0), 0)),
  })).sort((a, b) => b.amount - a.amount);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { monthlyBudget: true } });
  const monthKey = isoDay(today).slice(0, 7);
  const daysInMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)).getUTCDate();
  const currentMonth = allDaily.filter((d) => d.date.startsWith(monthKey));
  const runRate = currentMonth.slice(-7).reduce((a, r) => a + r.total, 0) / Math.max(1, Math.min(7, currentMonth.length));
  let cumulative = 0;
  const forecast = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const actual = currentMonth[i];
    if (actual) cumulative += actual.total;
    const isLastActual = i === currentMonth.length - 1;
    return {
      day,
      actual: actual ? round(cumulative) : null,
      projected: actual && !isLastActual ? null : round(cumulative + runRate * (day - currentMonth.length)),
      budget: round((user.monthlyBudget / daysInMonth) * day),
    };
  });

  return { range, daily, monthly, breakdown, forecast, budget: user.monthlyBudget };
}

/** Rolling z-score anomaly detection on the latest day of each service. */
export async function detectAnomalies(userId: string) {
  const today = startOfUtcDay();
  const daily = await loadDaily(userId, new Date(today.getTime() - 15 * DAY));
  if (daily.length < 8) return [];
  const latest = daily.at(-1)!;
  const history = daily.slice(0, -1);
  return SERVICES.flatMap((service) => {
    const values = history.map((d) => Number(d[service] ?? 0));
    const mean = values.reduce((a, v) => a + v, 0) / values.length;
    const std = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length) || 1;
    const value = Number(latest[service] ?? 0);
    const z = (value - mean) / std;
    return z > 3 ? [{ service, value: round(value), mean: round(mean), change: round(((value - mean) / mean) * 100, 1) }] : [];
  });
}
