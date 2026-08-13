// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { headers as nextHeaders } from "next/headers";
import { prisma } from "./db";

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
});

/**
 * Returns the current admin session for a server component or route
 * handler, or null if no one is signed in.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await nextHeaders() });
}
