# QA Issues — Spatial Computing Lab Website

Source: friend's QA pass. Not filed as GitHub issues yet — use this as the working list.

Status: ✅ fixed & verified · 🔧 in progress · ⬜ still open

## Setup / environment

### ✅ 1. `npm install` fails with `EALLOWGIT`
- **Env:** npm 12.0.2 (Node v24.19.0 via nvm)
- **Repro:** clone repo → `npm install`
- **Error:** `npm error code EALLOWGIT` — refuses to fetch `three-bmfont-text` (a transitive git dependency pinned to a commit on dmarcos's fork, pulled in by `aframe`)
- **Root cause:** npm 12's new default `allow-git=none` blocks any git-URL dependency unless allowed. Since `three-bmfont-text` is transitive (not a direct dependency), `allow-git=root` isn't enough.
- **Fix:** project-scoped `.npmrc` with `allow-git=all`, scoped to this project only.
- **Verified:** `npm install` completes clean. Confirmed with a controlled Docker test (npm 12.0.2): fails with `EALLOWGIT` without `.npmrc`, passes with it. Also confirmed on a real fresh `git clone`.
- Fixed alongside Issue 3 — `.npmrc` is now committed.

### ✅ 2. `npx prisma migrate dev` fails: `Environment variable not found: DATABASE_URL`
- **Env:** Prisma CLI 6.19.3
- **Root cause:** Prisma CLI only auto-loads a file literally named `.env`, not `.env.local`. Project only had `.env.local`.
- **Fix:** created `.env` at project root with `DATABASE_URL="file:../data/lab.db"` (gitignored via `.env*`), and created the missing `data/` directory (Prisma creates the SQLite file on migrate but not missing parent dirs).
- **Verified:** `npx prisma migrate dev` runs clean, applies all 4 migrations, regenerates Prisma Client.

### ✅ 14. `npm install` warns that 6 packages' install scripts aren't covered by `allowScripts`
- **Env:** npm 12.0.2 — surfaced while verifying Issue 1's fix
- **Warning:** `esbuild`, `sharp`, `prisma`, `@prisma/client`, `@prisma/engines`, `unrs-resolver` all have install/postinstall scripts (native binaries for esbuild/sharp, Prisma engine setup) that npm 12's script-approval policy won't run without explicit trust.
- **Root cause:** npm 12 added a second, separate lockfile-style trust list (`allowScripts` in `package.json`) for install-time lifecycle scripts, distinct from the `allow-git` policy in Issue 1. Note: the `allow-scripts` *`.npmrc`* config only applies to global/one-off installs (`npx`, `npm install -g`) — for a project install like this one it's a no-op (and passing `--allow-scripts` on a project install is a hard error), so this could **not** be fixed via `.npmrc`.
- **Fix:** ran `npm approve-scripts --all`, which wrote a pinned `allowScripts` entry to `package.json` for all six packages.
- **Verified:** confirmed native binaries (`esbuild`, `sharp`) load correctly (`require()` succeeds) and a clean `rm -rf node_modules && npm install` produces no `allow-scripts`/`install-scripts` warning.

---

## 🔴 High — Security / Data Integrity

### ✅ 3. `.npmrc` isn't committed, so a fresh clone can't `npm install`
- **Where:** repo root — `git status --short .npmrc` → `?? .npmrc`
- **Impact:** deployment to the Merrimack CS server is a fresh `git clone`; without this file, `npm install` fails on the `aframe` step exactly as in Issue 1.
- **Fix:** `git add .npmrc && git commit` — done, commit `9075511`.
- **Verified:** fresh clone + `npm install` on a real second checkout completes clean, no `EALLOWGIT`.

### ✅ 4. Admin account mutations and their audit-log entries aren't atomic
- **Where:** `scripts/delete-admin.ts:47-49` and the same pattern in `lock-admin.ts`, `unlock-admin.ts`, `change-pass.ts`, `force-reset.ts`, `create-admin.ts`, plus `src/lib/auth.ts`'s `account.update.after` hook
- **Impact:** zero `$transaction` usage in the repo. If `logAdminAction(...)` fails after the mutation already committed (e.g. `SQLITE_BUSY` from the always-running Next.js server hitting `data/lab.db` concurrently), the account is already deleted/locked/reset with no audit trail — defeating the audit log's purpose for exactly the operations it exists to catch.
- **Fix:** `logAdminAction` now takes a Prisma client/transaction handle; every call site wraps its mutation(s) and the log write in `prisma.$transaction(...)` so they commit or roll back together. Commit `93d43df`.
- **Verified:** ran the full account lifecycle (create → lock → unlock → change-pass → force-reset → delete) against the dev database; `ls-admin`/`admin-log` show one log entry per mutation, no orphaned mutations or dropped log entries.

### ✅ 5. `mustChangePassword` is set by force-reset but never enforced
- **Where:** `prisma/schema.prisma` (`mustChangePassword` field), `src/app/admin/(protected)/layout.tsx` — layout only checked `if (!session) redirect(...)`, never read `mustChangePassword`. `ls-admin` only showed it as an informational label.
- **Impact:** an admin who force-resets a compromised account and hands out the temp password got no real enforcement — recipient could use the dashboard indefinitely without being forced to `/admin/change-password`.
- **Fix:**
  1. Added `mustChangePassword` to Better Auth's `user.additionalFields` in `src/lib/auth.ts` (`type: "boolean", defaultValue: false, input: false`) so `session.user.mustChangePassword` is populated.
  2. Restructured `src/app/admin/(protected)/` so every protected page *except* `change-password` sits under a nested `(guarded)` route group (`(protected)/(guarded)/`) with its own `layout.tsx` that redirects to `/admin/change-password` when `session.user.mustChangePassword` is true. Route groups don't change the URL, so this doesn't move `/admin` — the dashboard `page.tsx` just moved into `(protected)/(guarded)/page.tsx`. Using a nested group instead of a pathname check keeps this correct as new protected pages (e.g. the upcoming media manager) get added.
- **Verified:** `npx tsc --noEmit` clean. Created a throwaway admin, force-reset it, and drove the real flow through the running dev server via HTTP: signed-in session showed `mustChangePassword: true`; `GET /admin` 307-redirected to `/admin/change-password` while `/admin/change-password` itself loaded (no redirect loop); after a successful self-service `changePassword` call, `/admin` remained blocked until the existing 60s session-cookie cache (documented, pre-existing behavior) expired, then returned 200. Throwaway account deleted afterward; real admin's audit history untouched.

---

## 🟠 Medium — User-Facing Correctness

### 🚫 6. Not an issue — `TEMP_TEST_ITEM` is test scaffolding on `test/360-viewer`, not mainline code
- **Where:** `src/app/(public)/viewer/page.tsx:72` (`TEMP_TEST_ITEM`), `ViewerClient.tsx:75` fallback.
- **Original report:** QA pass flagged the "no hash" fallback always showing a leftover debug placeholder instead of real content.
- **Correction:** the QA tester was working on the `test/360-viewer` branch, which carries `TEMP_TEST_ITEM` as an intentional testing fixture for that branch only — not a real defect in the actual codebase. No fix needed; disregard.

### 🚫 7. Not an issue — `page.tsx`'s catch block already sets `loadError: true`
- **Where:** `src/app/(public)/viewer/page.tsx:58`.
- **Original report:** claimed the catch block hardcoded `loadError: false`, so a DB outage would look identical to an empty gallery.
- **Correction:** checked `git log -p` on this file back to its original commit (`d24c752`) — it has always set `loadError: true` on catch. Like #6, this was apparently reported against the QA tester's branch, not this codebase. No fix needed; disregard.

### ✅ 8. Prev/Next navigation silently resets viewer preferences
- **Where:** `ViewerClient.tsx:126` — `<Viewer360 key={activeItem.id} media={activeItem} />`
- **Impact:** keying on `activeItem.id` fully unmounts/remounts `Viewer360` on every click, resetting local state — `reverseDrag` ("Inverted Controls," `Viewer360.jsx:23`) and `muted` (`Viewer360.jsx:19`) — back to defaults. A visitor who disables inverted controls or unmutes, then clicks "Next," gets both silently flipped back.
- **Fix:** lifted `muted`/`reverseDrag` state up to `ViewerClient` (`useState` alongside `hashParams`) and passed them plus their setters down as props to `Viewer360`, which now takes them as props instead of owning its own state. The `key={activeItem.id}` remount still resets everything else (zoom, fullscreen) as intended — only the two preferences survive.
- **Verified:** `npx tsc --noEmit` clean.

### 🚫 9. Not an issue — footer's mailto already matches its visible text
- **Where:** `src/components/public/Footer.tsx:20-23`.
- **Original report:** claimed `href="mailto:spatialcomputinglab@merrimack.edu"` (with "lab") didn't match the visible text `spatialcomputing@merrimack.edu`.
- **Correction:** both the href and the visible text read `spatialcomputing@merrimack.edu`, matching `about/page.tsx:45,48` exactly. Same pattern as #6/#7 — reported against the QA tester's branch, not this codebase. No fix needed; disregard.

### ✅ 10. `#collection=<slug>` deep links are case/encoding-sensitive against a normalized comparison
- **Where:** `ViewerClient.tsx:15-32,73-78` — `hashParams.collectionSlug` comes straight from the URL unmodified, compared against `slugify(item.collection)` (lowercased, hyphenated).
- **Impact:** a link like `#collection=Greece-2026`, or one with a literal space from `+`-encoding, won't match `"greece-2026"` — viewer silently falls back to the most recent item instead of the intended collection.
- **Fix:** normalize `hashParams.collectionSlug` through `slugify()` before comparing, so casing and `+`-decoded spaces (`URLSearchParams` already decodes `+` to a space) resolve the same as a properly-slugged link.
- **Verified:** `npx tsc --noEmit` clean.

---

## 🟡 Low — Scaling / Hardening (not bugs yet, worth tracking)

### ✅ 11. No indexes on `media.published` / `category` / `collection` / `featured`
- **Where:** `prisma/schema.prisma` — `Media` model.
- **Impact:** every public page and the admin dashboard filters on these columns; fine at current scale, will cause full table scans once SFTP-imported legacy media grows.
- **Fix:** added `@@index([published])`, `@@index([category])`, `@@index([collection])`, `@@index([featured])` to the `Media` model; applied via `npx prisma migrate dev --name add_media_filter_indexes`.
- **Verified:** migration `20260825140635_add_media_filter_indexes` applied clean against the dev database; `npx tsc --noEmit` clean.

### ✅ 12. Admin dashboard's `findMany` is unbounded
- **Where:** `src/app/admin/(protected)/(guarded)/page.tsx:15` — loaded every media row with no pagination; compounds with #11 as the media table grows.
- **Fix:** capped the query with `take: DASHBOARD_ROW_LIMIT` (200) and added a note under the page heading when the table is truncated (`Showing the 200 most recently added, out of N total.`). This dashboard is a read-only overview, not the future media manager, so a cap is proportionate — full pagination should land with the media manager's own list view instead.
- **Verified:** `npx tsc --noEmit` clean.

### ⬜ 13. No filesystem/path-traversal validation exists yet
`MEDIA_DIR` still has zero references anywhere in `src/`/`scripts/` (re-checked), and `media.src` is an unconstrained `String` column. Not a bug yet (the vulnerable code doesn't exist) — nothing to change until the media manager's upload route exists. Re-flag this against that route's implementation: it must explicitly validate against `../`/absolute-path traversal per CLAUDE.md's own warning, since there's no existing scaffolding to inherit safety from.
