// scripts/unlock-admin.ts
//
// Restores sign-in access to an admin account previously locked with
// lock-admin.
//
// Usage:
//   npm run unlock-admin -- --email you@merrimack.edu
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
    console.error("Usage: npm run unlock-admin -- --email you@merrimack.edu");
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

  if (!admin.disabled) {
    console.error(`Admin ${normalizedEmail} is not locked.`);
    process.exit(1);
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: { disabled: false },
  });

  await logAdminAction("unlocked", normalizedEmail);

  console.log(`Unlocked admin account for ${normalizedEmail}.`);
}

main()
  .catch((error) => {
    console.error("Failed to unlock admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
