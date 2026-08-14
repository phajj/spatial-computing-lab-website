// src/app/api/auth/[...all]/route.ts
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Better Auth handles all of its own routes (sign-in, sign-out, session
// checks, etc.) under /api/auth/*. This file just wires that up — the
// login page calls into it via the client in src/lib/auth-client.ts.
export const { GET, POST } = toNextJsHandler(auth);
