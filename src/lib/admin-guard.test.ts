// src/lib/admin-guard.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { IncomingMessage, ServerResponse } from "node:http";
import { withAdminGuard } from "./admin-guard";

const PUBLIC_IP = "203.0.113.7";

function fakeRequest(
  url: string,
  remoteAddress: string,
  { method = "GET", headers = {} }: { method?: string; headers?: Record<string, string> } = {}
) {
  return { url, method, headers: { ...headers }, socket: { remoteAddress } } as unknown as IncomingMessage;
}

function fakeResponse() {
  const res = {
    statusCode: 200,
    headersSent: false,
    body: "",
    setHeader() {},
    end(chunk?: string) {
      res.body = chunk ?? "";
    },
  };
  return res;
}

// Stand-ins for Next.js: the real page handler answers 200, the 404
// renderer answers 404.
function run(req: IncomingMessage) {
  const res = fakeResponse();
  const guarded = withAdminGuard(
    (_req, r) => {
      r.statusCode = 200;
      r.end("page");
    },
    (_req, r) => {
      r.statusCode = 404;
      r.end("not found");
    }
  );
  guarded(req, res as unknown as ServerResponse);
  return res;
}

const ADMIN_ROUTES: [string, string][] = [
  ["GET", "/admin"],
  ["GET", "/admin/login"],
  ["GET", "/admin/change-password"],
  ["GET", "/admin/media"],
  ["GET", "/admin/media/abc123"],
  ["POST", "/api/admin/media"],
  ["PATCH", "/api/admin/media/abc123"],
  ["POST", "/api/auth/sign-in/email"],
  ["POST", "/api/auth/sign-out"],
  ["GET", "/api/auth/get-session"],
];

test("admin routes return 404 from a public address", () => {
  for (const [method, url] of ADMIN_ROUTES) {
    assert.equal(run(fakeRequest(url, PUBLIC_IP, { method })).statusCode, 404, `${method} ${url}`);
  }
});

test("a spoofed X-Forwarded-For: 127.0.0.1 from a public address is still rejected", () => {
  for (const [method, url] of ADMIN_ROUTES) {
    const req = fakeRequest(url, PUBLIC_IP, {
      method,
      headers: { "x-forwarded-for": "127.0.0.1", "x-real-ip": "127.0.0.1" },
    });
    assert.equal(run(req).statusCode, 404, `${method} ${url}`);
  }
});

test("X-Forwarded-For is overwritten with the real peer address", () => {
  const req = fakeRequest("/admin/login", "127.0.0.1", {
    headers: { "x-forwarded-for": "198.51.100.1" },
  });
  run(req);
  assert.equal(req.headers["x-forwarded-for"], "127.0.0.1");
});

test("public routes return 200 from a public address", () => {
  for (const url of ["/", "/gallery", "/viewer", "/about", "/media/x/photo.jpg", "/administrator"]) {
    assert.equal(run(fakeRequest(url, PUBLIC_IP)).statusCode, 200, url);
  }
});

test("admin routes load over loopback (the SSH tunnel)", () => {
  for (const address of ["127.0.0.1", "::1", "::ffff:127.0.0.1"]) {
    assert.equal(run(fakeRequest("/admin", address)).statusCode, 200, address);
  }
});

test("state-changing admin requests need a loopback Origin", () => {
  const allowed = fakeRequest("/api/admin/media", "127.0.0.1", {
    method: "POST",
    headers: { origin: "http://localhost:8080" },
  });
  assert.equal(run(allowed).statusCode, 200);

  const crossSite = fakeRequest("/api/admin/media/abc", "127.0.0.1", {
    method: "PATCH",
    headers: { origin: "http://evil.example" },
  });
  assert.equal(run(crossSite).statusCode, 403);

  const noOrigin = fakeRequest("/api/auth/sign-in/email", "127.0.0.1", { method: "POST" });
  assert.equal(run(noOrigin).statusCode, 403);
});
