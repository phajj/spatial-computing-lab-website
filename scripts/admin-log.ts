// scripts/admin-log.ts
//
// Shows the audit log of admin-account actions: created, deleted,
// password_changed (change-pass), force_reset, locked, unlocked. Every
// other admin script (create-admin, delete-admin, change-pass,
// force-reset, lock-admin, unlock-admin) writes an entry here via
// src/lib/audit-log.ts. Log entries are kept even after an account is
// deleted, since they're not tied to it by a foreign key.
//
// Usage:
//   npm run admin-log
//   npm run admin-log -- --email you@merrimack.edu
//   npm run admin-log -- --since 2026-08-01 --until 2026-08-14
//
// --since/--until accept either a plain date (YYYY-MM-DD, inclusive of
// the whole day) or a full ISO timestamp. Both are optional and can be
// combined with --email.
import { prisma } from "../src/lib/db";

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for --${key}`);
      }
      args[key] = value;
      i++;
    }
  }
  return args;
}

// Formats a Date as "MM-DD-YYYY HH:MM:SS" in the local timezone of
// whoever runs the script.
function formatDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${month}-${day}-${year} ${hours}:${minutes}:${seconds}`;
}

function parseBoundaryDate(value: string, boundary: "start" | "end"): Date {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(
    dateOnly ? `${value}T${boundary === "start" ? "00:00:00" : "23:59:59.999"}` : value
  );
  if (isNaN(date.getTime())) {
    throw new Error(
      `"${value}" isn't a valid date. Use YYYY-MM-DD or a full ISO timestamp.`
    );
  }
  return date;
}

async function main() {
  const { email, since, until } = parseArgs(process.argv.slice(2));

  const where: {
    adminEmail?: string;
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  if (email) {
    where.adminEmail = email.trim().toLowerCase();
  }

  if (since || until) {
    where.createdAt = {};
    if (since) where.createdAt.gte = parseBoundaryDate(since, "start");
    if (until) where.createdAt.lte = parseBoundaryDate(until, "end");
  }

  const entries = await prisma.adminAuditLog.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  if (entries.length === 0) {
    console.log("No matching log entries found.");
    return;
  }

  for (const entry of entries) {
    const details = entry.details ? ` — ${entry.details}` : "";
    console.log(
      `${formatDate(entry.createdAt)} — ${entry.adminEmail} — ${entry.action}${details}`
    );
  }
}

main()
  .catch((error) => {
    console.error("Failed to show admin log:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
