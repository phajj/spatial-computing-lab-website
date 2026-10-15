// src/lib/origin-check.ts

/**
 * CSRF defense for admin write routes: true only when a request's Origin
 * header is exactly the site admins sign in at (BETTER_AUTH_URL). Browsers
 * always send Origin on POST/PATCH, so a request from any other site fails.
 */
export function isTrustedOrigin(origin: string | null): boolean {
  if (!origin || !process.env.BETTER_AUTH_URL) return false;
  try {
    return origin === new URL(process.env.BETTER_AUTH_URL).origin;
  } catch {
    return false;
  }
}
