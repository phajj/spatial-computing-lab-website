// src/lib/auth.ts
import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { headers as nextHeaders } from "next/headers";
import { prisma } from "./db";
import { logAdminAction } from "./audit-log";

// Server-side Better Auth instance. The Prisma "Admin" model stands in
// for Better Auth's default "user" model (see prisma/schema.prisma),
// since this app only ever has a handful of known lab-staff accounts.
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    // No public signup — admin accounts are created only via the
    // `create-admin` script (see scripts/create-admin.ts).
    disableSignUp: true,
  },
  user: {
    modelName: "admin",
  },
  session: {
    modelName: "session",
    fields: {
      userId: "adminId",
    },
  },
  account: {
    modelName: "account",
    fields: {
      userId: "adminId",
    },
  },
  databaseHooks: {
    session: {
      create: {
        // Blocks sign-in for accounts locked via the lock-admin script,
        // with a message the login page displays as-is.
        before: async (session) => {
          const admin = await prisma.admin.findUnique({
            where: { id: session.userId },
            select: { disabled: true },
          });
          if (admin?.disabled) {
            throw APIError.from("FORBIDDEN", {
              message: "Account is locked. Please contact the account admin.",
              code: "ACCOUNT_LOCKED",
            });
          }
        },
      },
    },
    account: {
      update: {
        // Fires only when Better Auth itself updates a credential account
        // — in this app, that's exclusively the self-service /change-password
        // flow (the change-pass/force-reset CLI scripts write to the
        // database directly and don't go through Better Auth). A
        // successful self-service change is what satisfies a pending
        // force-reset, so clear the flag here.
        after: async (account) => {
          if (account.providerId !== "credential") return;
          const admin = await prisma.admin.update({
            where: { id: account.userId },
            data: { mustChangePassword: false },
            select: { email: true },
          });
          await logAdminAction(
            "password_changed",
            admin.email,
            "self-service, via admin portal"
          );
        },
      },
    },
  },
});

/**
 * Returns the current admin session for a server component or route
 * handler, or null if no one is signed in.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await nextHeaders() });
}
