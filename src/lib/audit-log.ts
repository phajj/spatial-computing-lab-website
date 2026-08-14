// src/lib/audit-log.ts
import { prisma } from "./db";

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

export async function logAdminAction(
  action: AdminAuditAction,
  adminEmail: string,
  details?: string
) {
  await prisma.adminAuditLog.create({
    data: { action, adminEmail, details: details ?? null },
  });
}
