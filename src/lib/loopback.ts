// src/lib/loopback.ts

// Every path that belongs to the admin area. Better Auth's /api/auth/* is
// included because only the admin portal ever signs in.
const ADMIN_PREFIXES = ["/admin", "/api/admin", "/api/auth"];

const LOOPBACK_ADDRESSES = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** True only when a TCP peer address is this machine itself. */
export function isLoopback(address: string | undefined | null): boolean {
  return typeof address === "string" && LOOPBACK_ADDRESSES.has(address);
}

/**
 * True for a browser Origin header like `http://localhost:8080` — any port,
 * since each admin picks their own local port for the SSH tunnel.
 */
export function isLoopbackOrigin(origin: string | undefined | null): boolean {
  if (!origin) return false;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  return (
    url.protocol === "http:" &&
    LOOPBACK_HOSTNAMES.has(url.hostname) &&
    url.origin === origin
  );
}

/**
 * True when a raw request URL resolves to an admin route. Normalizes the
 * path the way Next.js would before routing it (dot segments, percent
 * encoding, repeated slashes) so `/%61dmin` or `/gallery/../admin` can't
 * slip past. Matches whole segments, so `/administrator` is not admin.
 */
export function isAdminPath(rawUrl: string | undefined): boolean {
  const target = rawUrl || "/";
  let pathname: string;
  try {
    // Prefixing (rather than using URL's base argument) keeps `//admin`
    // from being read as a hostname.
    const url = target.startsWith("/") ? new URL(`http://localhost${target}`) : new URL(target);
    pathname = decodeURIComponent(url.pathname);
  } catch {
    // Unparseable URLs never reach a real page, so blocking them costs nothing.
    return true;
  }
  const normalized = pathname.replace(/\\/g, "/").replace(/\/{2,}/g, "/").toLowerCase();
  return ADMIN_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}
