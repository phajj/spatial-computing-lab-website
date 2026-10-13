// server.ts
import { createServer } from "node:http";
import { withAdminGuard } from "./src/lib/admin-guard";

// Replaces `next start` / `next dev` so every request can be checked
// against its real TCP peer address before Next.js sees it — Next's own
// middleware and route handlers have no access to the socket.
const dev = process.argv.includes("--dev");
const port = Number(process.env.PORT) || 3000;

async function main() {
  // `next start` and `next dev` set NODE_ENV themselves; a custom server
  // has to, and before Next.js is loaded.
  if (!process.env.NODE_ENV) {
    Object.assign(process.env, { NODE_ENV: dev ? "development" : "production" });
  }
  const { default: next } = await import("next");

  const app = next({ dev });
  const handle = app.getRequestHandler();
  await app.prepare();

  const render404 = async (
    req: Parameters<typeof handle>[0],
    res: Parameters<typeof handle>[1]
  ) => {
    try {
      await app.render404(req, res);
    } catch (error) {
      console.error("Failed to render 404 page:", error);
      if (!res.headersSent) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
      }
      res.end("Not Found");
    }
  };

  // No host argument: listen on every interface, exactly like `next start`.
  createServer(withAdminGuard(handle, render404)).listen(port, () => {
    console.log(`Spatial Lab listening on port ${port} (${dev ? "development" : "production"})`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
