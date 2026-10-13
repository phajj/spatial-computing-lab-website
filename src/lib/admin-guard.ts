// src/lib/admin-guard.ts
import type { IncomingMessage, ServerResponse } from "node:http";
import { isAdminPath, isLoopback, isLoopbackOrigin } from "./loopback";

type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<void> | void;

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Wraps the Next.js request handler so the admin area only answers to
 * requests from this machine — in practice, an admin's SSH tunnel.
 * Everyone else gets the site's normal 404 page, as if /admin didn't exist.
 */
export function withAdminGuard(handle: Handler, render404: Handler): Handler {
  return (req, res) => {
    // The actual TCP peer. There is no reverse proxy in front of this app,
    // so forwarding headers (X-Forwarded-For, X-Real-IP, ...) come straight
    // from the client and can say anything — the "trust proxy" setting
    // other frameworks have is effectively off here, by design. Overwrite
    // X-Forwarded-For with the real peer, because both Next.js and Better
    // Auth's login rate limiter read it.
    const peer = req.socket.remoteAddress;
    if (peer) {
      req.headers["x-forwarded-for"] = peer;
    } else {
      delete req.headers["x-forwarded-for"];
    }

    if (isAdminPath(req.url)) {
      if (!isLoopback(peer)) {
        return render404(req, res);
      }
      // CSRF defense: browsers always send Origin on POST/PATCH/DELETE, so a
      // state-changing request from any other site is refused here.
      if (!SAFE_METHODS.has(req.method ?? "GET") && !isLoopbackOrigin(req.headers.origin)) {
        res.statusCode = 403;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Forbidden");
        return;
      }
    }

    return handle(req, res);
  };
}
