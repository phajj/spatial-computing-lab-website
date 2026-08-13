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
| Deployment | Self-hosted on the Merrimack College CS server, running as a `systemd` service (no reverse proxy — listens directly on port `49168`) |

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
   - `DATABASE_URL` — path to the SQLite file, e.g. `file:./data/lab.db`
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
   (Admins should change their password after first login — see the admin user guide.)

6. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
  app/
    (public)/     ← public-facing pages (home, gallery, viewer, about)
    admin/        ← protected admin portal (/admin)
    api/          ← API routes
  components/
    ui/           ← reusable UI primitives
    admin/        ← admin-only components
    public/       ← public-site components
    Viewer360.jsx ← A-Frame 360° viewer (all A-Frame logic lives here only)
  lib/
    db.ts         ← Prisma client initialization
    auth.ts       ← Better Auth config and session helpers
prisma/
  schema.prisma   ← SQLite schema (media, admins, plus Better Auth's session/account tables)
scripts/
  create-admin.ts ← creates an admin account (see Setup step 5)
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