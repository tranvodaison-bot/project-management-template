import { type PrismaClient } from "@prisma/client";

export interface RlsContext {
  tenantId: string;
  userId: string;
}

/**
 * Creates a Prisma client scoped to a specific tenant and user via
 * PostgreSQL session-level settings used by RLS policies.
 */
export function withRls(prisma: PrismaClient, ctx: RlsContext): PrismaClient {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const [, result] = await prisma.$transaction([
            prisma.$executeRawUnsafe(`SELECT set_config('app.tenant_id', $1, true)`, ctx.tenantId),
            prisma.$executeRawUnsafe(`SELECT set_config('app.user_id', $1, true)`, ctx.userId),
            query(args),
          ]);
          return result;
        },
      },
    },
  }) as unknown as PrismaClient;
}

/**
 * Sets RLS session variables for a raw query context.
 */
export async function setRlsContext(
  prisma: PrismaClient,
  ctx: Partial<RlsContext>,
): Promise<void> {
  if (ctx.tenantId) {
    await prisma.$executeRawUnsafe(
      `SELECT set_config('app.tenant_id', $1, false)`,
      ctx.tenantId,
    );
  }
  if (ctx.userId) {
    await prisma.$executeRawUnsafe(
      `SELECT set_config('app.user_id', $1, false)`,
      ctx.userId,
    );
  }
}
