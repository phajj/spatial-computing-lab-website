# Merrimack College Spatial Computing Lab — 360° Media Website

A web platform for the Merrimack College Spatial Computing Lab that hosts immersive 360° photos and videos. Includes a public-facing site and a password-protected admin portal for lab staff.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router) |
| Database | [SQLite](https://sqlite.org) via [Prisma](https://www.prisma.io) |
| Auth | [Better Auth](https://www.better-auth.com) (email + password, session-based) |
| Media storage | Local disk on the Merrimack CS server, delivered via SFTP or admin upload |
| 360° Viewer | [A-Frame](https://aframe.io) (WebXR) |
| Styling | [Tailwind CSS](https://tailwindcss.com) |
| Deployment | Self-hosted on the Merrimack College CS server, running as a `systemd` service (listens directly on port `49168`) |

## Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/phajj/spatial-computing-lab-website
   cd spatial-computing-lab-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env.local` and fill in your local config:
   ```bash
   cp .env.example .env.local
   ```
   Then open `.env.local` and add:
   - `DATABASE_URL` — path to the SQLite file, e.g. `file:../data/lab.db` (Prisma resolves this relative to `prisma/schema.prisma`, not the project root, hence the `../`)
   - `MEDIA_DIR` — absolute path to the directory where 360° media lives on disk, e.g. `/srv/spatial-lab/media`
   - `BETTER_AUTH_SECRET` — a long random string used to sign session cookies
   - `BETTER_AUTH_URL` — the site's base URL (e.g. `http://localhost:3000` in dev, the production domain in prod)

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   ```
   This creates the SQLite file and applies the schema (see `prisma/schema.prisma`).

5. **Create your first admin account**
   ```bash
   npm run create-admin -- --email you@merrimack.edu --password <temporary-password>
   ```
   (Admins should change their password after first login — see the admin user guide.) See [Managing Admin Accounts](#managing-admin-accounts) below for the full set of account scripts.

6. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Managing Admin Accounts

There is no self-service signup — admin accounts (email + password, via Better Auth) are managed entirely through these scripts. All of them read `.env.local` for `DATABASE_URL`, same as the app itself.

- **Create an admin**
  ```bash
  npm run create-admin -- --email you@merrimack.edu --password <temporary-password>
  ```

- **List admins** — shows every admin's email, name, locked status, creation date, last sign-in, when their password was last changed, and whether a forced reset is pending
  ```bash
  npm run ls-admin
  ```

- **Change an admin's password** — also signs them out of every active session, so a leaked old password can't still be used
  ```bash
  npm run change-pass -- --email you@merrimack.edu --password <new-password>
  ```

- **Force-reset an admin's password** — unlike `change-pass`, generates and prints a random temporary password rather than taking one you choose; use this for a suspected-compromised account or to issue a fresh temp password without picking one yourself. Also signs them out everywhere and marks the account as needing a password change (`ls-admin` shows this as "RESET REQUIRED" until the admin signs in and changes it themselves at `/admin/change-password`)
  ```bash
  npm run force-reset -- --email you@merrimack.edu
  ```

- **Lock an admin** — blocks sign-in without deleting the account or its history.The command also signs them out of every active session. An already-open browser tab can keep working for up to 60 seconds after this, since admin sessions are cached in a cookie for that long (`session.cookieCache` in `src/lib/auth.ts`) (see Admin Portal below)
  ```bash
  npm run lock-admin -- --email you@merrimack.edu
  ```

- **Unlock an admin** — restores sign-in access
  ```bash
  npm run unlock-admin -- --email you@merrimack.edu
  ```

- **Delete an admin** — also removes that admin's sessions and password/credential record (cascading delete, see `prisma/schema.prisma`). As with locking, an already-open browser tab can keep working for up to 60 seconds after this, due to the session cookie cache (see Admin Portal below)
  ```bash
  npm run delete-admin -- --email you@merrimack.edu
  ```

- **View the admin audit log** — every action above (`created`, `deleted`, `password_changed`, `force_reset`, `locked`, `unlocked`) is recorded with a timestamp. Entries survive account deletion, since they're not tied to the account by a foreign key. Filter by account and/or a date range; `--since`/`--until` accept `YYYY-MM-DD` (inclusive of the whole day) or a full ISO timestamp
  ```bash
  npm run admin-log
  npm run admin-log -- --email you@merrimack.edu
  npm run admin-log -- --since 2026-08-01 --until 2026-08-14
  ```

## Admin Portal

Reached at `/admin` after signing in at `/admin/login`. Everything under `/admin` except `/admin/login` requires a session, enforced server-side in `src/app/admin/(protected)/layout.tsx`, which redirects to `/admin/login` if there isn't one. Session checks are cached in a signed cookie for 60 seconds (`session.cookieCache` in `src/lib/auth.ts`) so most admin page loads skip the database.

- **Dashboard** (`/admin`) — total/published/draft counts and a table of all media. Read-only for now; uploading and editing media (the media manager) hasn't been built yet.
- **Change Password** (`/admin/change-password`) — lets a signed-in admin change their own password: current password, then the new one twice. Requires the current password to match (same check Better Auth uses at sign-in) and revokes every other active session on success, while keeping the current one signed in. If the account had a pending forced reset (see `force-reset` above), this clears it.

> **Not in scope (this step):** the media manager (drag-and-drop upload, metadata editing) is the next piece of the admin portal.

## Project Structure

```
src/
  app/
    (public)/         ← public-facing pages (home, gallery, viewer, about)
    admin/
      login/          ← /admin/login (public, no session required)
      (protected)/    ← everything else under /admin (session required — see Admin Portal)
        layout.tsx    ← redirects to /admin/login if there's no session
        page.tsx      ← dashboard (/admin)
        change-password/ ← self-service password change
    api/              ← API routes
  components/
    ui/               ← reusable UI primitives
    admin/            ← admin-only components (e.g. AdminNav.tsx)
    public/           ← public-site components
    Viewer360.jsx     ← A-Frame 360° viewer (all A-Frame logic lives here only)
  lib/
    db.ts         ← Prisma client initialization
    auth.ts       ← Better Auth config and session helpers
    audit-log.ts  ← writes entries to the admin audit log (used by the scripts below)
prisma/
  schema.prisma   ← SQLite schema (media, admins, plus Better Auth's session/account tables)
scripts/
  create-admin.ts ← creates an admin account (see Setup step 5)
  ls-admin.ts     ← lists all admin accounts
  admin-log.ts    ← shows the admin audit log, with account/date filtering (see Managing Admin Accounts)
  change-pass.ts  ← changes an admin's password (see Managing Admin Accounts)
  force-reset.ts  ← resets an admin's password to a random temporary one (see Managing Admin Accounts)
  lock-admin.ts   ← locks an admin out without deleting the account (see Managing Admin Accounts)
  unlock-admin.ts ← restores a locked admin's access (see Managing Admin Accounts)
  delete-admin.ts ← deletes an admin account (see Managing Admin Accounts)
data/
  lab.db          ← SQLite database file (not committed — see .gitignore)
media/            ← 360° photo/video files, served statically (not committed)
```

> **Not in scope (possible future addition):** Articles and Events pages are not being built at this time and may be added in a future phase.

## Media & Deployment Notes

- 360° media lives on disk on the Merrimack CS server, under `MEDIA_DIR`. Legacy media arrives via SFTP directly into that directory; new media can also be uploaded through the admin portal, which writes the file to disk and registers its metadata in SQLite.
- Back up `data/lab.db` regularly (a nightly cron job copying it off-box is enough) — self-hosting means backups are our responsibility, not a platform's.
- Deployment runs directly on the Merrimack CS server as a `systemd` service at `/projects/spatial-lab`. The app listens directly on port `49168` so the site is reachable at `http://cs.merrimack.edu:49168`. A cleaner URL path may be added later; don't hardcode assumptions about one.

## Technical Context

See [CLAUDE.md](./CLAUDE.md) for the full technical brief, including database schema, brand guidelines, coding conventions, and feature roadmap.
