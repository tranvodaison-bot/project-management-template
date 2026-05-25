# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

FTZ-ERP is a production-ready ERP platform for Vietnamese Free Trade Zone and industrial zone management. It is a **pnpm monorepo** using **Turborepo**, with a Next.js 15 web app and shared packages for the database layer and auth/permission utilities.

---

## Commands

### First-time setup
```bash
pnpm setup          # copies .env.example → .env, starts Docker services, runs migrations & seed
```

### Development
```bash
pnpm dev            # start all apps via Turborepo (Next.js on :3000)
pnpm build          # production build
pnpm typecheck      # TypeScript check across all packages
pnpm lint           # Biome check (linting + formatting)
pnpm lint:fix       # auto-fix lint/format issues
```

### Database
```bash
pnpm db:generate    # regenerate Prisma client after schema changes
pnpm db:migrate     # run prisma migrate dev (creates migration files)
pnpm db:seed        # seed demo data (tenant, users, project, accounts)

# Direct package commands (from repo root):
pnpm --filter @ftz-erp/db db:push       # push schema without migration file
pnpm --filter @ftz-erp/db db:studio     # open Prisma Studio
pnpm --filter @ftz-erp/db db:reset      # reset DB and re-run all migrations
```

### Infrastructure services
```bash
docker compose -f infra/docker/docker-compose.yml up -d   # start all services
```

Dev services: PostgreSQL :5432, Redis :6379, MinIO :9000/:9001, Meilisearch :7700, Temporal :7233/:8080, Mailhog :1025/:8025

Default login after seed: `admin@ftz-erp.com`

---

## Architecture

### Monorepo layout
```
apps/web/          — Next.js 15 app (App Router)
packages/db/       — @ftz-erp/db: Prisma client, RLS helpers
packages/auth/     — @ftz-erp/auth: permission types, RBAC helpers
packages/config/   — shared tsconfig presets
infra/
  docker/          — docker-compose.yml + init-db.sql for dev services
  scripts/         — setup-dev.sh
```

### Web app (`apps/web`)
- **Next.js 15** with App Router; pages live under `src/app/`
- **Auth.js v5 (NextAuth beta)** via `@auth/prisma-adapter`; middleware at `src/middleware.ts` guards all routes except `/login` and `/api/auth`
- **tRPC v11 + TanStack Query** for API calls
- **Tailwind CSS v4** + **Radix UI** primitives + `lucide-react` icons
- Utility functions in `src/lib/utils.ts`: `cn()` (class merging), `formatCurrency()` / `formatDate()` default to `vi-VN` locale and VND

### Database package (`packages/db`)
- Prisma 6 with a **split schema** — each domain lives in its own file under `packages/db/prisma/schema/`:
  - `foundation.prisma` — Tenant, CdeContainer, Document, DocumentRevision, DocumentApproval (the CDE layer)
  - `auth.prisma` — User, Account, Session, Role, UserRole, AbacPolicy, Notification
  - `projects.prisma` — Project, WbsNode, Contract, QcInspection, HseIncident, ProcurementRequest/Rfq/Bid, RiskRegisterItem
  - `hrm.prisma` — HrmEmployee, HrmDepartment, HrmPosition, HrmLeaveRequest, HrmPayrollRun, HrmRecruitmentJob, HrmTrainingProgram, HrmPerformanceReview
  - `finance.prisma` — FinAccount (Vietnamese chart of accounts), FinJournalEntry/Line, FinProjectBudget, FinInvoicePayable/Receivable
  - `work.prisma` — Plan, Task, KanbanBoard, TimeLog
  - `business.prisma` — BusinessContact, CrmDeal, MnaTarget, OpsZoneTenant, OpsWorkOrder, LegalFile, LegalRegulation, AuditLog
  - `assets.prisma` — Asset, AssetMaintenanceSchedule/Log, AssetDisposal, IotDevice, IotReading
- All schema commands must pass `--schema prisma/schema` (already wired in package.json scripts)
- Import the singleton client: `import { prisma } from "@ftz-erp/db"`

### Multi-tenancy and RLS
Every model carries a `tenantId` UUID. Row Level Security is enforced at the PostgreSQL session level via two session variables: `app.tenant_id` and `app.user_id`. The `withRls()` helper wraps a PrismaClient so every query in that session automatically sets these variables:

```ts
import { withRls } from "@ftz-erp/db/rls";
const db = withRls(prisma, { tenantId, userId });
```

Always use `withRls` in server-side handlers that touch tenant-scoped data. Raw queries can use `setRlsContext()` instead.

### Auth & permissions (`packages/auth`)
Permissions follow the format `resource:action`. Resources are the 12 ERP modules (`documents`, `work`, `hrm`, `finance`, `projects`, `assets`, `business`, `operations`, `legal`, `admin`, `ai`, `audit`). Actions are `read | write | delete | approve | export | *`.

```ts
import { checkPermission, assertPermission } from "@ftz-erp/auth";
// assertPermission throws if the user lacks the permission
assertPermission(ctx, "projects", "write");
```

Roles store an array of permission strings. Wildcard `resource:*` grants all actions on that resource.

### Document lifecycle (ISO 19650 / CDE)
Documents follow: **WIP → SHARED → PUBLISHED → ARCHIVED**. CdeContainers form a hierarchy (`zone → project → building → system`) stored using PostgreSQL `ltree`. Documents link polymorphically to any module via `moduleType` + `moduleRefId`.

### Key infrastructure dependencies
- **TimescaleDB** extension on Postgres (used for IoT time-series readings in `iot_readings`)
- **ltree** extension for hierarchical paths on `cde_containers` and `wbs_nodes`
- **pg_trgm** + **unaccent** for Vietnamese full-text search
- **Temporal.io** for long-running document approval workflows (`workflowInstanceId` on `DocumentRevision`)
- **MinIO** for file storage (bucket `ftz-erp`); `storageBucket` + `storageKey` on `DocumentRevision`
- **Meilisearch** for search

---

## Code conventions

### Formatting (Biome)
- 2-space indent, 100-char line width, double quotes, trailing commas, semicolons always
- Run `pnpm lint:fix` to auto-fix; CI runs `pnpm lint`

### TypeScript
- Strict mode enabled everywhere; `noExplicitAny` is a warning (not error) in `.ts`/`.tsx`
- Shared tsconfig presets in `packages/config/tsconfig/`: `base.json`, `node.json`, `nextjs.json`
- Packages export directly from source TypeScript (no build step for internal packages)

### Currency and locale
All monetary values are `Decimal(18, 2)` in VND by default. Format with `formatCurrency()` from `@ftz-erp/web`'s utils. Use `vi-VN` locale for dates and numbers unless the tenant settings override it.

### Status state machines
Models use string enum-style status fields with documented transitions in comments. Don't free-form new statuses — match the existing patterns (e.g., `DRAFT | PENDING | APPROVED | PAID` for finance models).
