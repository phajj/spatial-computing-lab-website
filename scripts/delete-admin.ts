// scripts/delete-admin.ts
//
// Deletes an admin account (e.g. a temporary account used for testing).
// Cascades to that admin's sessions and credential record automatically
// (see the `onDelete: Cascade` relations in prisma/schema.prisma).
//
// Usage:
//   npm run delete-admin -- --email you@merrimack.edu
import { prisma } from "../src/lib/db";
import { logAdminAction } from "../src/lib/audit-log";

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

async function main() {
  const { email } = parseArgs(process.argv.slice(2));

  if (!email) {
    console.error("Usage: npm run delete-admin -- --email you@merrimack.edu");
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.admin.findUnique({
    where: { email: normalizedEmail },
  });
  if (!existing) {
    console.error(`No admin found with email ${normalizedEmail}.`);
    process.exit(1);
  }

  await prisma.$transaction(async (tx) => {
    await tx.admin.delete({ where: { id: existing.id } });
    await logAdminAction(tx, "deleted", normalizedEmail);
  });

  console.log(`Deleted admin account for ${normalizedEmail}.`);
}

main()
  .catch((error) => {
    console.error("Failed to delete admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
