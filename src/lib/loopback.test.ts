// src/lib/loopback.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { isAdminPath, isLoopback, isLoopbackOrigin } from "./loopback";

test("isLoopback accepts only loopback addresses", () => {
  for (const address of ["127.0.0.1", "::1", "::ffff:127.0.0.1"]) {
    assert.equal(isLoopback(address), true, address);
  }
  for (const address of ["203.0.113.7", "2001:db8::1", "::ffff:10.0.0.5", undefined, ""]) {
    assert.equal(isLoopback(address), false, String(address));
  }
});

test("isLoopbackOrigin accepts http loopback origins on any port", () => {
  for (const origin of ["http://localhost:8080", "http://127.0.0.1:9000", "http://[::1]:8080", "http://localhost"]) {
    assert.equal(isLoopbackOrigin(origin), true, origin);
  }
  for (const origin of [
    "http://cs.merrimack.edu:49168",
    "https://localhost:8080",
    "http://localhost.evil.com",
    "http://localhost:8080/admin",
    "null",
    "",
    undefined,
  ]) {
    assert.equal(isLoopbackOrigin(origin), false, String(origin));
  }
});

test("isAdminPath matches admin prefixes, including disguised ones", () => {
  for (const url of [
    "/admin",
    "/admin/",
    "/admin/login",
    "/admin/media/abc?x=1",
    "/api/admin/media",
    "/api/admin/media/abc",
    "/api/auth/sign-in/email",
    "/ADMIN",
    "//admin",
    "/%61dmin",
    "/gallery/../admin",
    "/gallery/%2e%2e/admin",
    "http://cs.merrimack.edu:49168/admin",
  ]) {
    assert.equal(isAdminPath(url), true, url);
  }
});

test("isAdminPath leaves public paths alone", () => {
  for (const url of [
    "/",
    "/gallery",
    "/viewer#viewer=abc",
    "/about",
    "/media/greece-spring-2026/lighthouse.jpg",
    "/administrator",
    "/admin-tools",
    "/api/administrator",
    "/api/authors",
    "/_next/static/chunks/main.js",
  ]) {
    assert.equal(isAdminPath(url), false, url);
  }
});
