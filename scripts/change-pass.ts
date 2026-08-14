// scripts/change-pass.ts
//
// Changes an existing admin's password from the command line (e.g. to
// reset a forgotten password, or rotate a temporary one).
//
// Usage:
//   npm run change-pass -- --email you@merrimack.edu --password <new-password>
import { hashPassword } from "better-auth/crypto";
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

async function main() {
  const { email, password } = parseArgs(process.argv.slice(2));

  if (!email || !password) {
    console.error(
      "Usage: npm run change-pass -- --email you@merrimack.edu --password <new-password>"
    );
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const admin = await prisma.admin.findUnique({
    where: { email: normalizedEmail },
  });
  if (!admin) {
    console.error(`No admin found with email ${normalizedEmail}.`);
    process.exit(1);
  }

  const account = await prisma.account.findFirst({
    where: { adminId: admin.id, providerId: "credential" },
  });
  if (!account) {
    console.error(
      `Admin ${normalizedEmail} has no email+password credential to change.`
    );
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  // Updating this row bumps its updatedAt (Prisma's @updatedAt), which
  // ls-admin reads as the "password changed" timestamp.
  await prisma.account.update({
    where: { id: account.id },
    data: { password: passwordHash },
  });

  // Signing out everywhere on a password change is standard practice —
  // if the old password leaked, a stale session would otherwise still work.
  const { count } = await prisma.session.deleteMany({
    where: { adminId: admin.id },
  });

  console.log(
    `Changed password for ${normalizedEmail}. Signed out ${count} active session(s).`
  );
}

main()
  .catch((error) => {
    console.error("Failed to change password:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
