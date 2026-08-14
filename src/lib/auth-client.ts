// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

// Browser-side Better Auth client. This is what client components (like
// the /admin/login form) call to sign in — it talks to the API route
// handler in src/app/api/auth/[...all]/route.ts under the hood.
// No baseURL is set: the client defaults to the current origin, which is
// correct here since the admin portal, API, and public site are all
// served from the same Next.js app on the same port.
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
