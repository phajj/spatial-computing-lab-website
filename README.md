# Merrimack College Spatial Computing Lab — 360° Media Website

A web platform for the Merrimack College Spatial Computing Lab that hosts immersive 360° photos and videos. Includes a public-facing site and a password-protected admin portal for lab staff.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router) |
| Database | [SQLite](https://sqlite.org) via [Prisma](https://www.prisma.io) |
| Auth | [Better Auth](https://www.better-auth.com) (email + password, session-based) |
| Media storage | Local disk on the Merrimack CS server, added through admin portal upload |
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
   - `BETTER_AUTH_URL` — the URL admins sign in from: `http://localhost:3000` in dev, and `http://localhost:8080` on the server (the admin SSH tunnel address, see [ADMIN.md](./ADMIN.md)). Not the public `cs.merrimack.edu:49168` address, since the admin area doesn't answer there

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
   Open [http://localhost:3000](http://localhost:3000) in your browser. This runs the same custom server (`server.ts`) as production, so the admin area's loopback-only guard is active locally too. That's harmless here, because your own browser is loopback.

7. **Run the tests**
   ```bash
   npm test
   ```

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

**The admin area only answers to requests from the server itself.** Admins reach it through an SSH tunnel at `http://localhost:8080/admin`; step-by-step instructions for lab staff are in **[ADMIN.md](./ADMIN.md)**. From anywhere else, every admin route (`/admin/*`, `/api/admin/*`, and Better Auth's `/api/auth/*`) returns the site's normal 404 page. This is enforced in `server.ts` / `src/lib/admin-guard.ts`, which check the real TCP peer address before Next.js sees the request. The guard ignores headers like `X-Forwarded-For`, because there's no proxy in front of the app and any client can fake them.

Reached at `/admin` after signing in at `/admin/login`. Everything under `/admin` except `/admin/login` requires a session, enforced server-side in `src/app/admin/(protected)/layout.tsx`, which redirects to `/admin/login` if there isn't one. Session checks are cached in a signed cookie for 60 seconds (`session.cookieCache` in `src/lib/auth.ts`) so most admin page loads skip the database.

- **Dashboard** (`/admin`) — total/published/draft counts and a table of all media. Click a title to open its edit page.
- **Media Manager** (`/admin/media`) — drag-and-drop upload, plus a list of all media filterable by All / Drafts / Published, with a one-click **Publish** / **Unpublish** button on each row.
- **Edit Media** (`/admin/media/<id>`) — edit an item's details and change its publish status. The file itself can't be replaced here.
- **Change Password** (`/admin/change-password`) — lets a signed-in admin change their own password: current password, then the new one twice. Requires the current password to match (same check Better Auth uses at sign-in) and revokes every other active session on success, while keeping the current one signed in. If the account had a pending forced reset (see `force-reset` above), this clears it.

### Admin Portal Workflow

This is the day-to-day process for lab staff adding 360° media to the site. A short version of these steps also appears in the portal itself, under **How publishing works** on the Media Manager and Edit Media pages.

1. **Sign in** — open the SSH tunnel (see [ADMIN.md](./ADMIN.md)), then go to `http://localhost:8080/admin/login` and sign in with the email and password you were given. If it's your first sign-in or your password was reset, go to **Change Password** and set your own.
2. **Upload** — open **Media Manager**, then drag a 360° file into the upload box (or click it to browse). Photos must be equirectangular JPEG or PNG; videos must be MP4 or WebM. Fill in:
   - **Title** (required) — defaults to the file name.
   - **Type** — photo or video; set automatically from the file extension.
   - **Category** — Study Abroad or Campus Events. This drives the Gallery's category filter.
   - **Album** — pick an existing album, or choose **+ New album…** and name it `Destination Season Year` (e.g. "Greece Spring 2026"). Reuse an existing album rather than retyping it, so one trip doesn't end up split into two.
   - **Location**, **Date**, **Description** — optional, shown with the item on the public site.
   - **Feature on the home page** — puts it in the Home page's featured grid.
   - **Hotspots** — optional, advanced; leave blank unless you know the JSON format.

   Click **Upload as draft**. Every upload starts as a **draft**, which only signed-in admins can see.
3. **Review** — click the item's title in the list (or on the Dashboard) to open its edit page. Check the details and fix anything that's wrong. **Save draft** saves your changes without making the item public.
4. **Publish** — click **Publish** on the item's row in the Media Manager, or **Save & publish** on its edit page. It appears on the public Home, Gallery, and 360° Viewer pages immediately.
5. **Check it live** — on a published item's edit page, click **View on public site** to open it in the 360° Viewer in a new tab.
6. **Make changes later** — edit a published item and click **Save changes**; the public site updates immediately and the item stays published.
7. **Unpublish** — click **Unpublish** in the list, or **Save & unpublish** on the edit page, and confirm. The item comes off the public site and goes back to draft. Its file and details are kept, so you can publish it again at any time.

Use the **Drafts** filter in the Media Manager to see everything that's been uploaded but not published yet.

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
        media/        ← media manager (/admin/media) and edit page (/admin/media/<id>)
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
    loopback.ts   ← isLoopback / isAdminPath helpers for the admin guard
    admin-guard.ts ← blocks admin routes for non-loopback requests (used by server.ts)
server.ts         ← custom server: runs Next.js behind the loopback-only admin guard
ADMIN.md          ← SSH-tunnel sign-in guide for lab staff
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

- 360° media lives on disk on the Merrimack CS server, under `MEDIA_DIR`. All media is added through the admin portal's Media Manager, which writes the file to disk and creates its metadata row in SQLite in the same step. Don't copy files into `MEDIA_DIR` by hand — without a metadata row they won't appear anywhere on the site.
- The site is deployed with an empty `MEDIA_DIR`; the initial library is uploaded through the admin portal after launch (see [Admin Portal Workflow](#admin-portal-workflow)).
- Media files are served through `/media/...` (`src/app/media/[...path]/route.ts`). Only files belonging to a **published** media row are served publicly; drafts, and any file in `MEDIA_DIR` without a media row, return 404 unless an admin is signed in.
- Back up `data/lab.db` regularly (a nightly cron job copying it off-box is enough) — self-hosting means backups are our responsibility, not a platform's.
- Deployment runs directly on the Merrimack CS server as a `systemd` service at `/projects/spatial-lab`. The app listens directly on port `49168` so the site is reachable at `http://cs.merrimack.edu:49168`. A cleaner URL path may be added later; don't hardcode assumptions about one.
- The app starts through the custom server `server.ts` (`npm start` → `tsx server.ts`), not `next start`, so it can apply the loopback-only admin guard. Deploy with `npm install && npx next build`, then restart the service. The `systemd` unit should run:
  ```ini
  WorkingDirectory=/projects/spatial-lab
  Environment=PORT=49168
  Environment=NODE_ENV=production
  ExecStart=/usr/bin/npm start
  ```
  (Use the output of `which npm` on the server if npm lives somewhere else.) On the server, set `BETTER_AUTH_URL="http://localhost:8080"` in `.env.local`, since admins sign in through the SSH tunnel.

## Technical Context

See [CLAUDE.md](./CLAUDE.md) for the full technical brief, including database schema, brand guidelines, coding conventions, and feature roadmap.
