// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

// Next.js reloads modules on every code change in dev, which would
// otherwise create a new PrismaClient (and a new SQLite connection)
// on every save. Stashing the client on `globalThis` keeps a single
// instance alive across those reloads; in production this branch
// never runs since the module is only evaluated once.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
