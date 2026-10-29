# CloudPulse

Cloud infrastructure & cost optimization dashboard for DevOps teams. Monitor AWS spend, forecast the monthly bill, detect idle resources and get real-time budget/anomaly alerts.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide, Recharts, SWR |
| Backend | Next.js Route Handlers (`src/app/api`) with a typed JSON envelope, Zod validation |
| Database | PostgreSQL + Prisma (Users, CloudConnections, CloudResources, CostLogs, Alerts) |
| Auth | JWT (HS256, `jose`) in an httpOnly cookie, bcrypt password hashing, route protection in `src/proxy.ts` |
| Realtime | Server-Sent Events (`/api/alerts/stream`) |

## Quick start

```bash
cp .env.example .env            # set JWT_SECRET: openssl rand -base64 48
docker compose up -d db         # PostgreSQL 16 on :5432
npm install
npm run setup                   # prisma migrate deploy + seed
npm run dev                     # http://localhost:3000
```

Demo login: `demo@cloudpulse.dev` / `Demo@1234` (or use "Try the live demo"). Every new signup gets its own provisioned demo workspace with 180 days of mock AWS cost data.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm run db:migrate` / `db:seed` / `db:studio` | Prisma workflows |

## Project structure

```
prisma/                 schema, migrations, seed
src/app/                routes: landing, (auth), dashboard/*, api/*
src/components/ui       design-system primitives (button, card, modal, skeleton…)
src/components/landing  marketing page sections
src/components/dashboard shell, charts, views
src/lib/                server libs: prisma, jwt, session, api envelope, validation, analytics, mock data
src/types/              shared API types
```

## API

All responses: `{ success: true, data, meta? }` or `{ success: false, error: { code, message, details? } }`.

| Method | Route | Notes |
| --- | --- | --- |
| GET | `/api/health` | Liveness + DB check |
| POST | `/api/auth/signup` · `/api/auth/login` · `/api/auth/logout` | Rate limited per IP |
| GET | `/api/auth/me` | Current session |
| GET | `/api/dashboard/summary` | MTD spend, MoM, forecast, budget, savings |
| GET | `/api/costs?range=7d\|30d\|90d\|180d` | Daily/monthly/service/forecast series |
| GET | `/api/resources?status=&service=&q=&sort=` | Optimization scanner |
| POST | `/api/resources/scan` · `/api/resources/:id/optimize` | Optimize requires OWNER/ADMIN |
| GET/PATCH | `/api/alerts` | List / mark read |
| GET | `/api/alerts/stream` | SSE live alerts |
| GET/PATCH | `/api/profile` | Profile + monthly budget |
| GET/POST/DELETE | `/api/connections[/:id]` | AWS role-ARN connections (mock STS) |

## Production notes

- Docker: `docker build -t cloudpulse .` builds a standalone image (`NEXT_OUTPUT=standalone`). Run `npx prisma migrate deploy` against the target DB before starting.
- The rate limiter is in-memory; use Redis/Upstash when running multiple replicas.
- AWS data is mocked deterministically (`src/lib/mock-data.ts`); swap in Cost Explorer / CloudWatch via STS AssumeRole for real accounts.
