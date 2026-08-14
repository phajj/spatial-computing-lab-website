// scripts/ls-admin.ts
//
// Lists all admin accounts (email, name, created date, last sign-in,
// password last changed, locked status, forced-reset status). Read-only
// — useful for checking who has access, or finding the email to pass to
// delete-admin/change-pass/lock-admin/force-reset.
//
// "Last sign-in" is the createdAt of that admin's most recent session
// row. Note this reflects the last sign-in that still has a live session
// row in the database — signing out deletes that row, so a recently
// signed-out admin may show an earlier sign-in (or "Never") instead.
//
// "Password changed" is the updatedAt of the admin's credential account
// row, shown only if it differs from that row's createdAt (i.e. the
// password was changed via change-pass since the account was created).
//
// Usage:
//   npm run ls-admin
import { prisma } from "../src/lib/db";

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

async function main() {
  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      email: true,
      name: true,
      createdAt: true,
      disabled: true,
      mustChangePassword: true,
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
      accounts: {
        where: { providerId: "credential" },
        take: 1,
        select: { createdAt: true, updatedAt: true },
      },
    },
  });

  if (admins.length === 0) {
    console.log("No admin accounts found.");
    return;
  }

  for (const admin of admins) {
    const name = admin.name ? ` (${admin.name})` : "";
    const lastSignIn = admin.sessions[0]
      ? formatDate(admin.sessions[0].createdAt)
      : "Never";

    const account = admin.accounts[0];
    const passwordChanged =
      account && account.updatedAt.getTime() !== account.createdAt.getTime()
        ? formatDate(account.updatedAt)
        : "Never";

    const status = admin.disabled ? "LOCKED" : "active";
    const resetFlag = admin.mustChangePassword ? " — RESET REQUIRED" : "";

    console.log(
      `${admin.email}${name} — ${status} — created: ${formatDate(admin.createdAt)} — last sign-in: ${lastSignIn} — password changed: ${passwordChanged}${resetFlag}`
    );
  }
}

main()
  .catch((error) => {
    console.error("Failed to list admins:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
