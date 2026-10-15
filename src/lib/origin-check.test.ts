// src/lib/origin-check.test.ts
import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { isTrustedOrigin } from "./origin-check";

const originalUrl = process.env.BETTER_AUTH_URL;

afterEach(() => {
  if (originalUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalUrl;
  }
});

test("isTrustedOrigin accepts only the exact BETTER_AUTH_URL origin", () => {
  process.env.BETTER_AUTH_URL = "https://cs.merrimack.edu:49168/";
  assert.equal(isTrustedOrigin("https://cs.merrimack.edu:49168"), true);
  for (const origin of [
    "http://cs.merrimack.edu:49168",
    "https://cs.merrimack.edu",
    "https://cs.merrimack.edu:49168/admin",
    "https://cs.merrimack.edu.evil.com:49168",
    "https://evil.example",
    "http://localhost:3000",
    "null",
    "",
    null,
  ]) {
    assert.equal(isTrustedOrigin(origin), false, String(origin));
  }
});

test("isTrustedOrigin ignores a path in BETTER_AUTH_URL", () => {
  process.env.BETTER_AUTH_URL = "https://cs.merrimack.edu/spatial-computing";
  assert.equal(isTrustedOrigin("https://cs.merrimack.edu"), true);
});

test("isTrustedOrigin allows localhost only when BETTER_AUTH_URL is localhost", () => {
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  assert.equal(isTrustedOrigin("http://localhost:3000"), true);
  assert.equal(isTrustedOrigin("http://localhost:8080"), false);
  assert.equal(isTrustedOrigin("http://127.0.0.1:3000"), false);
});

test("isTrustedOrigin rejects everything when BETTER_AUTH_URL is missing or invalid", () => {
  delete process.env.BETTER_AUTH_URL;
  assert.equal(isTrustedOrigin("http://localhost:3000"), false);
  process.env.BETTER_AUTH_URL = "not a url";
  assert.equal(isTrustedOrigin("http://localhost:3000"), false);
});
