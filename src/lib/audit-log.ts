// src/lib/audit-log.ts
import type { Prisma, PrismaClient } from "@prisma/client";

// The full set of admin-account actions the CLI scripts record. Keeping
// this as a union (rather than letting each script pass an arbitrary
// string) is what keeps the log's action names consistent enough to
// filter/read reliably.
export type AdminAuditAction =
  | "created"
  | "deleted"
  | "password_changed"
  | "force_reset"
  | "locked"
  | "unlocked";

// Accepts either the top-level PrismaClient or the client handed to a
// `prisma.$transaction(async (tx) => ...)` callback. Callers doing an
// account mutation alongside a log entry should pass the transaction's
// `tx`, not `prisma` directly, so the two writes commit or roll back
// together instead of risking a mutation with no audit trail.
type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

export async function logAdminAction(
  db: PrismaClientOrTx,
  action: AdminAuditAction,
  adminEmail: string,
  details?: string
) {
  await db.adminAuditLog.create({
    data: { action, adminEmail, details: details ?? null },
  });
}
