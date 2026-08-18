// scripts/create-admin.ts
//
// Creates the first (or an additional) admin account. This is the only
// way admin accounts get created — there is no public sign-up page.
//
// Usage:
//   npm run create-admin -- --email you@merrimack.edu --password <temporary-password>
import { hashPassword } from "better-auth/crypto";
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
  const { email, password, name } = parseArgs(process.argv.slice(2));

  if (!email || !password) {
    console.error(
      "Usage: npm run create-admin -- --email you@merrimack.edu --password <temporary-password> [--name \"Full Name\"]"
    );
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    console.error(`"${email}" doesn't look like a valid email address.`);
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const existing = await prisma.admin.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    console.error(`An admin with email ${normalizedEmail} already exists.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.$transaction(async (tx) => {
    const created = await tx.admin.create({
      data: {
        email: normalizedEmail,
        name: name ?? null,
        emailVerified: true,
      },
    });

    // Better Auth's credential (email+password) accounts key `accountId`
    // off the admin's own id, matching what its sign-up flow does.
    await tx.account.create({
      data: {
        adminId: created.id,
        accountId: created.id,
        providerId: "credential",
        password: passwordHash,
      },
    });

    await logAdminAction(tx, "created", created.email, name ? `name: ${name}` : undefined);

    return created;
  });

  console.log(`Created admin account for ${admin.email} (id: ${admin.id}).`);
}

main()
  .catch((error) => {
    console.error("Failed to create admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
