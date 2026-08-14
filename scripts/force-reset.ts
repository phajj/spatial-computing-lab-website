// scripts/force-reset.ts
//
// Force-resets an admin's password to a randomly generated temporary
// one (unlike change-pass, which sets a password you choose). Use this
// when an account may be compromised, or to issue a fresh temporary
// password without picking one yourself. Also flags the account as
// needing a password change and signs it out everywhere.
//
// The generated password is printed once — it is not stored anywhere
// in plain text, so write it down or relay it to the admin now.
//
// Note: nothing in the app currently reads the "must change password"
// flag — there's no admin-portal UI yet to prompt for a new password on
// next login (see mustChangePassword in prisma/schema.prisma). For now
// ls-admin surfaces it so you know who's still on a forced reset.
//
// Usage:
//   npm run force-reset -- --email you@merrimack.edu
import { randomBytes } from "crypto";
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

// Avoids visually ambiguous characters (0/O, 1/l/I) since this is meant
// to be read off a terminal and typed in by hand.
const PASSWORD_CHARS =
  "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function generateTempPassword(length = 16) {
  const bytes = randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARS[bytes[i] % PASSWORD_CHARS.length];
  }
  return password;
}

async function main() {
  const { email } = parseArgs(process.argv.slice(2));

  if (!email) {
    console.error("Usage: npm run force-reset -- --email you@merrimack.edu");
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

  const account = await prisma.account.findFirst({
    where: { adminId: admin.id, providerId: "credential" },
  });
  if (!account) {
    console.error(
      `Admin ${normalizedEmail} has no email+password credential to reset.`
    );
    process.exit(1);
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  await prisma.account.update({
    where: { id: account.id },
    data: { password: passwordHash },
  });

  await prisma.admin.update({
    where: { id: admin.id },
    data: { mustChangePassword: true },
  });

  const { count } = await prisma.session.deleteMany({
    where: { adminId: admin.id },
  });

  console.log(
    `Force-reset password for ${normalizedEmail}. Signed out ${count} active session(s).`
  );
  console.log(`Temporary password (shown once): ${tempPassword}`);
}

main()
  .catch((error) => {
    console.error("Failed to force-reset password:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
