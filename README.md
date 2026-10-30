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
| Deployment | Self-hosted on the Merrimack College CS server |

## Local Development Setup

For setting up the production server, see [Deployment](#deployment) instead.

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
   - `MEDIA_DIR` — absolute path to the directory where uploaded 360° media is stored, e.g. the repo's own `media/` folder (it's gitignored)
   - `BETTER_AUTH_SECRET` — a long random string used to sign session cookies (`openssl rand -base64 32`)
   - `BETTER_AUTH_URL` — `http://localhost:49168`. Admin write requests are only accepted from this exact origin
   - `COOKIE_SECURE` — leave as `false` for local dev (plain HTTP)

4. **Set up the database**
   ```bash
   npm run prisma:migrate
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
   Open [http://localhost:49168](http://localhost:49168) in your browser.

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

- **Change an admin's password** — also signs them out of every active session
  ```bash
  npm run change-pass -- --email you@merrimack.edu --password <new-password>
  ```

- **Force-reset an admin's password** — unlike `change-pass`, generates and prints a random temporary password rather than taking one you choose; use this when an admin has forgotten their password or needs a fresh temporary one. Also signs them out everywhere and marks the account as needing a password change (`ls-admin` shows this as "RESET REQUIRED" until the admin signs in and changes it themselves at `/admin/change-password`)
  ```bash
  npm run force-reset -- --email you@merrimack.edu
  ```

- **Lock an admin** — blocks sign-in without deleting the account or its history, and signs them out of every active session
  ```bash
  npm run lock-admin -- --email you@merrimack.edu
  ```

- **Unlock an admin** — restores sign-in access
  ```bash
  npm run unlock-admin -- --email you@merrimack.edu
  ```

- **Delete an admin** — also removes that admin's sessions and password/credential record (cascading delete, see `prisma/schema.prisma`)
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

Reached at `/admin` on the public HTTPS site after signing in at `/admin/login`. Everything under `/admin` except `/admin/login` requires a session. Each admin page checks this itself by calling `requireAdmin()` from `src/lib/auth.ts`, which redirects to `/admin/login` if there isn't one; `src/app/admin/(protected)/layout.tsx` does the same check for the nav. Session checks are cached in a signed cookie for 60 seconds (`session.cookieCache` in `src/lib/auth.ts`) so most admin page loads skip the database.

Security:
- **Sign-in and password change are rate-limited** to 5 attempts per minute (`rateLimit` in `src/lib/auth.ts`).
- **Session cookies** are `HttpOnly` and `SameSite=Strict`. They're `Secure` (HTTPS-only) only when `COOKIE_SECURE=true`.
- **Admin write routes** (`/api/admin/*`) reject any request whose `Origin` header isn't exactly `BETTER_AUTH_URL`'s origin (`src/lib/origin-check.ts`), which stops other websites from submitting changes using a signed-in admin's cookies. Better Auth applies its own origin check to `/api/auth/*`.
- New admin pages must call `requireAdmin()`, and new admin API routes must check both the origin and the session themselves, under `/admin`, `/api/admin` or `/api/auth`.

- **Dashboard** (`/admin`) — total/published/draft counts and a table of all media. Click a title to open its edit page.
- **Media Manager** (`/admin/media`) — drag-and-drop upload, plus a list of all media filterable by All / Drafts / Published, with a one-click **Publish** / **Unpublish** button on each row.
- **Edit Media** (`/admin/media/<id>`) — edit an item's details and change its publish status. The file itself can't be replaced here.
- **Change Password** (`/admin/change-password`) — lets a signed-in admin change their own password: current password, then the new one twice. Requires the current password to match (same check Better Auth uses at sign-in) and revokes every other active session on success, while keeping the current one signed in. If the account had a pending forced reset (see `force-reset` above), this clears it.

### Admin Portal Workflow

This is the day-to-day process for lab staff adding 360° media to the site. A short version of these steps also appears in the portal itself, under **How publishing works** on the Media Manager and Edit Media pages.

1. **Sign in** — go to `<public URL>/admin` and sign in with the email and password you were given. If it's your first sign-in or your password was reset, go to **Change Password** and set your own.
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
    origin-check.ts ← isTrustedOrigin, the CSRF check for admin write routes
prisma/
  schema.prisma   ← SQLite schema (media, admins, plus Better Auth's session/account tables)
scripts/
  create-admin.ts ← creates an admin account (see Managing Admin Accounts)
  ls-admin.ts     ← lists all admin accounts
  admin-log.ts    ← shows the admin audit log, with account/date filtering (see Managing Admin Accounts)
  change-pass.ts  ← changes an admin's password (see Managing Admin Accounts)
  force-reset.ts  ← resets an admin's password to a random temporary one (see Managing Admin Accounts)
  lock-admin.ts   ← locks an admin out without deleting the account (see Managing Admin Accounts)
  unlock-admin.ts ← restores a locked admin's access (see Managing Admin Accounts)
  delete-admin.ts ← deletes an admin account (see Managing Admin Accounts)
deploy/
  spatial-lab.service ← systemd unit for the server (see Deployment)
data/
  lab.db          ← SQLite database file (not committed — see .gitignore)
media/            ← 360° photo/video files, served statically (not committed)
```

> **Not in scope (possible future addition):** Articles and Events pages are not being built at this time and may be added in a future phase.

## Media Storage

- 360° media lives on disk on the Merrimack CS server, under `MEDIA_DIR`. All media is added through the admin portal's Media Manager, which writes the file to disk and creates its metadata row in SQLite in the same step.
- The site is deployed with an empty `MEDIA_DIR`; the initial library is uploaded through the admin portal after launch (see [Admin Portal Workflow](#admin-portal-workflow)).
- Media files are served through `/media/...` (`src/app/media/[...path]/route.ts`). Only files belonging to a **published** media row are served publicly; drafts, and any file in `MEDIA_DIR` without a media row, return 404 unless an admin is signed in.

## Deployment

The site runs on the Merrimack CS server from `/projects/spatial-lab`, as the `systemd` service `spatial-lab` (a `systemd` service is a program Linux starts at boot and restarts if it crashes). The service runs `npm start` (`next start`), which listens directly on port `49168` — there's no reverse proxy. The unit file is [`deploy/spatial-lab.service`](deploy/spatial-lab.service).

### First-time server setup

1. **Clone the repo and install dependencies** — as the account that will run the app (the unit file assumes `spatial-lab`; change `User=`/`Group=` if it's a different account)
   ```bash
   git clone https://github.com/phajj/spatial-computing-lab-website /projects/spatial-lab
   cd /projects/spatial-lab
   npm ci
   ```

2. **Create `.env.local`**
   ```bash
   cp .env.example .env.local
   chmod 600 .env.local
   ```
   Then set:
   - `DATABASE_URL="file:../data/lab.db"` (leave as-is)
   - `MEDIA_DIR=/projects/spatial-lab/media`
   - `BETTER_AUTH_SECRET` — a fresh value from `openssl rand -base64 32`. Don't reuse your dev secret
   - `BETTER_AUTH_URL` — the public URL admins sign in at, e.g. `http://cs.merrimack.edu:49168`
   - `COOKIE_SECURE` — whether session cookies get the `Secure` attribute. Only `1`, `true`, `yes` or `on` (any case) turn it on; anything else, or leaving it unset, means off. Keep it `false` while the site is plain HTTP: browsers never send a `Secure` cookie back over HTTP, so sign-in looks like it works and then bounces you back to the login page. **Switch it to `true` (and restart the service) once HTTPS is enabled.** If HTTPS is later handled by a reverse proxy in front of the app, `true` is still correct, because the browser only cares about its own connection to the proxy

   `PORT` and `NODE_ENV` are set in the unit file, not here.

3. **Create the data folders, database, and build**
   ```bash
   mkdir -p data media
   npm run prisma:deploy
   npm run build
   ```
   `prisma:deploy` applies the migrations in `prisma/migrations/` without generating new ones — never run `prisma:migrate` on the server.

4. **Create the first admin account**
   ```bash
   npm run create-admin -- --email you@merrimack.edu --password <temporary-password>
   ```

5. **Install and start the service** — check the `ExecStart=` path against `which npm` first
   ```bash
   sudo cp deploy/spatial-lab.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now spatial-lab
   ```

6. **Check it's running** — `systemctl status spatial-lab` should say `active (running)`. Then open the site, and sign in at `/admin`.

### Deploying an update

```bash
cd /projects/spatial-lab
sudo systemctl stop spatial-lab
cp data/lab.db ~/lab.db.$(date +%F-%H%M)   # backup in case a migration goes wrong
git pull
npm ci
npm run prisma:deploy
npm run build
sudo systemctl start spatial-lab
```

An update takes about a minute. The service is stopped first so dependencies and the build aren't replaced while the app is serving requests, and so the database backup is consistent.

If you change `deploy/spatial-lab.service`, copy it into `/etc/systemd/system/` again and run `sudo systemctl daemon-reload` before starting.

### Logs and service commands

```bash
journalctl -u spatial-lab -f             # follow live logs
journalctl -u spatial-lab --since today  # today's logs
sudo systemctl restart spatial-lab       # e.g. after editing .env.local
```

## Technical Context

See [CLAUDE.md](./CLAUDE.md) for the full technical brief, including database schema, brand guidelines, coding conventions, and feature roadmap.
