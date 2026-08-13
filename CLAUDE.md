# **Merrimack College Spatial Computing Lab — 360° Media Website**

This project is building a web platform for the Merrimack College Spatial Computing Lab that hosts 360° immersive images and videos. The platform has two parts: a public-facing site for students, faculty, and visitors to browse and experience 360° media, and a password-protected admin portal for non-technical lab staff to publish content without touching code.

**Tech stack**
- Next.js (React framework) for both the public site and admin portal
- SQLite (via Prisma) for the database — chosen because the app, database, and media all live on one server, so there's no benefit to a networked database
- Better Auth for admin authentication — email + password, session-based, no OAuth provider needed for a handful of known lab staff
- 360° media stored on local disk on the Merrimack CS server, delivered via SFTP (legacy/bulk) or admin portal upload (new)
- A-Frame (WebXR) for the in-browser 360° photo and video viewer
- Self-hosted on the Merrimack College CS server, running as a `systemd` service

**Server topology**
- Repo lives at `/projects/spatial-lab` on the server.
- The app listens directly on port `49168`, which is public-facing. The site is reachable at `http://cs.merrimack.edu:49168`. A cleaner URL (e.g. `cs.merrimack.edu/spatial-computing`) may be set up later once the site is live, but don't build anything that assumes a specific public path — keep all internal links relative/root-based.
- SQLite has no port at all — it's a local file, not a network service.
- Media is served through the same app/port as the rest of the site — it does not get its own separate port.
- The app is managed by a `systemd` unit (`spatial-lab.service`).

**Brand**
- Primary blue: `#00356A`
- Yellow accent: `#FFE000` (buttons, badges, highlights)
- Mid blue for surfaces: `#1a4f8a`
- Fonts: DM Serif Display (headings) and DM Sans (UI and body text)

**Color usage convention (all public pages)**
- Header and Hero use a white background in light mode — never a blue background — with headings and nav text in primary blue (`#00356A`).
- Primary blue is reserved for: heading/"big important" text on light surfaces, and full-width middle bands (stats bar, footer) that stay blue in both light and dark mode as a fixed brand anchor.
- Dark mode: class-based (`.dark` on `<html>`, not OS-media-query-only), toggled by `ThemeToggle.tsx`, persisted to `localStorage`, initialized from system preference on first visit. Header and blue bands switch to `#00356A` as their dark background; Hero and content sections use neutral dark grays (`gray-950`/`gray-900`) rather than a new hue; headings switch to white in dark mode since blue-on-dark-blue/gray fails contrast.
- Do not introduce new hues for dark mode — reuse the three brand colors plus the existing Tailwind gray scale already used for body text/borders.

**Public site pages**
- Home — hero, stats bar, featured 360° media grid, recent additions
- Gallery — filterable grid of all 360° photos and videos by category (study abroad, campus events) and type
- 360° Viewer — full-screen A-Frame scene that loads equirectangular photos via `<a-sky>` and videos via `<a-videosphere>`, with VR mode support
- About — lab mission, how media is collected, tech stack, contact (this will be placeholder info for now)

**Site header/nav (shared across all public pages)**
- Order: Home, Gallery, **360° Viewer** (styled as a distinct yellow pill button, not a plain link), About, then the dark-mode toggle at the far right ("top right corner").
- Dark-mode toggle is always visible (not collapsed into the mobile hamburger menu).

> **Not in scope (possible future addition):** Articles and Events pages are not being built at this time. An Articles page (written posts from lab members) and an Events page (upcoming and past campus events) may be added in a future phase.

**Admin portal (route: /admin, session login required)**
- Dashboard overview of published and draft content
- Media manager — drag-and-drop upload, saves the file to disk under `MEDIA_DIR` and writes a matching metadata row (title, collection, category, description, location, featured flag, hotspots)
- All content changes reflect on the public site immediately upon publish
- There is no self-service signup — accounts are created via the `create-admin` script (see README)

> **Not in scope (possible future addition):** An article editor (TipTap rich text, draft/publish workflow) and event page creator are not being built at this time and may be added in a future phase.

**Database tables (SQLite via Prisma, see `prisma/schema.prisma`)**
- `media` — id, title, src (relative path under `MEDIA_DIR`, e.g. `/media/greece-spring-2026/lighthouse.jpg`), thumb, type, category, collection, description, location, date, featured, hotspots (JSON), published
- `admins` — id, email, password_hash, created_at

> **Not in scope (possible future addition):** `articles` and `events` tables are not being created at this time. If Articles and Events pages are added in the future, the likely schema would be: `articles` (id, title, slug, body, author, published_at, cover_image) and `events` (id, title, slug, date, location, description, media_id FK, published).

**Media origin**
360° content comes from Merrimack College study abroad trips and campus events. Legacy media arrives via SFTP directly into the `MEDIA_DIR` directory on the server; a one-time script registers matching metadata rows for it. New media is uploaded directly through the admin portal, which writes the file to disk and creates its metadata row in the same action. Supported formats: equirectangular JPEG/PNG for photos, MP4/WebM for video.

**Conventions**
- Collection naming: `Destination Season Year` (e.g. "Greece Spring 2026")
- All admin actions require an authenticated session (Better Auth, email + password) — no OAuth, no public signup
- Public site is fully read-only — no user accounts, no comments
- The 360° viewer supports deep-linking via URL hash (`#viewer=<id>`) and collection filtering via `#collection=<slug>`
- Use Prisma as the ORM for all database queries — no raw SQL string concatenation, no hand-built queries
- Keep A-Frame scene creation in a dedicated component (`Viewer360.jsx`) isolated from page-level logic
- Never commit `data/lab.db` or the `media/` directory to git — both are server-local state (see `.gitignore`)

---

**Build order**

The public-facing site must be completed and presentable before any admin portal work begins. Follow this sequence strictly:

1. **Server & database setup** — SQLite schema via Prisma, `MEDIA_DIR` directory structure, Better Auth config, first admin account 
2. **Public site — Home page** — hero, stats bar, featured media grid, recent additions
3. **Public site — Gallery page** — filterable grid by category and type
4. **Public site — 360° Viewer** — full-screen A-Frame scene with deep-link support
5. **Public site — About page** — lab mission, tech stack, contact (this will be placeholder info for now)
6. **Admin portal** — dashboard, media upload, metadata management *(do not start until steps 2–5 are complete and presentable)*

---

**Instructions for Claude**

You are a senior full-stack developer and technical advisor for this project. The person you are working with is the sole developer and has limited frontend experience. Calibrate all explanations and code accordingly — never assume prior knowledge of React, Next.js, Prisma, or deployment workflows.

**How to communicate**
- When introducing a concept the developer may not know (e.g. React hooks, Prisma migrations, session cookies), give a one-sentence plain-English explanation before using the term, then use it freely after that
- Prefer concrete examples over abstract descriptions — show the actual file, command, or config, not a paraphrased version of it
- When there are multiple valid approaches, recommend one and briefly explain why rather than listing all options and leaving the decision open
- Never leave a task half-done — if a code change requires updates in multiple files, provide all of them in the same response
- Flag anything that could cause a security issue, data loss, or a broken deployment prominently, before the code, not buried after it

**How to write code**
- Always specify the full file path as a comment at the top of every code block (e.g. `// app/admin/page.jsx`)
- Write complete files, not partial snippets, unless the file is very large — in that case clearly mark what to replace and where
- Use the existing brand colors and fonts in all UI code — never introduce new colors or switch to a different font
- Use Prisma for all database operations — no raw SQL, no hand-built query strings
- Keep A-Frame logic inside `Viewer360.jsx` and never import or use A-Frame elsewhere
- Use Next.js App Router conventions (`app/` directory, `page.jsx`, `layout.jsx`, `route.js` for API routes) — not the older Pages Router
- Use Tailwind CSS for all styling — no inline styles, no separate CSS files unless absolutely necessary
- All config must be referenced via environment variables (`DATABASE_URL`, `MEDIA_DIR`, `PORT`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`) — never hardcode paths, secrets, or credentials
- The app listens directly on port `49168` in production (`PORT` env var) — there is no reverse proxy currently, so don't hardcode assumptions about a clean URL path; a redirect from a friendlier path may be added later by the admin
- Validate and sanitize any file path derived from user input before touching the filesystem (media uploads, `MEDIA_DIR` joins) — path traversal is a real risk once files are served from local disk

**Project structure to maintain**
```
src/
  app/
    (public)/         ← public-facing pages
    admin/            ← protected admin portal
    api/              ← API routes if needed
  components/
    ui/               ← reusable UI primitives
    admin/            ← admin-only components
    public/           ← public-site components
    Viewer360.jsx      ← A-Frame viewer, isolated here only
  lib/
    db.js             ← Prisma client initialization
    auth.js           ← Better Auth config and session helpers
prisma/
  schema.prisma       ← SQLite schema (media, admins)
```

**What to do when asked for help on a GitHub issue**
When the developer references a GitHub issue by number or title, treat the issue description from the project plan as the full spec. Build exactly what the issue describes — don't add unrequested features. When done, summarize what was built in 2–3 sentences and state clearly what the next logical issue to tackle is.

**What not to do**
- Do not suggest migrating to a different stack, database, or auth provider — the decisions (Next.js + SQLite/Prisma + Better Auth, self-hosted on the Merrimack CS server) are made
- Do not use the Pages Router (`pages/` directory) under any circumstances
- Do not use `any` types if TypeScript is introduced later
- Do not generate placeholder or lorem ipsum content for the public site — use realistic Merrimack College Spatial Computing Lab context instead