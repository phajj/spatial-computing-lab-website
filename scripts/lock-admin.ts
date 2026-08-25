// scripts/lock-admin.ts
//
// Locks an admin account without deleting it — a locked admin can't
// sign in (enforced in src/lib/auth.ts) but keeps their history in
// ls-admin. Also signs them out of every active session immediately.
// Use unlock-admin to restore access.
//
// Usage:
//   npm run lock-admin -- --email you@merrimack.edu
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
    console.error("Usage: npm run lock-admin -- --email you@merrimack.edu");
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const admin = await prisma.admin.findUnique({
    where: { email: normalizedEmail },
  });
  if (!admin) {
    console.error(`No admin found with email ${normalizedEmail}.`);
    process.exit(1);
  }

  if (admin.disabled) {
    console.error(`Admin ${normalizedEmail} is already locked.`);
    process.exit(1);
  }

  const { count } = await prisma.$transaction(async (tx) => {
    await tx.admin.update({
      where: { id: admin.id },
      data: { disabled: true },
    });

    const result = await tx.session.deleteMany({
      where: { adminId: admin.id },
    });

    await logAdminAction(tx, "locked", normalizedEmail, `revoked ${result.count} session(s)`);

    return result;
  });

  console.log(
    `Locked admin account for ${normalizedEmail}. Signed out ${count} active session(s).`
  );
}

main()
  .catch((error) => {
    console.error("Failed to lock admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
