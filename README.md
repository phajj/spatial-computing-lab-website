# Merrimack College Spatial Computing Lab — 360° Media Website

A web platform for the Merrimack College Spatial Computing Lab that hosts immersive 360° photos and videos alongside written articles and event pages. Includes a public-facing site and a password-protected admin portal for lab staff.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router) |
| Database & Auth | [Supabase](https://supabase.com) (PostgreSQL + Google OAuth) |
| 360° Viewer | [A-Frame](https://aframe.io) (WebXR) |
| Styling | [Tailwind CSS](https://tailwindcss.com) |
| Deployment | [Vercel](https://vercel.com) |

## Setup

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd spatial-computing-lab-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env.local` and fill in your Supabase project credentials:
   ```bash
   cp .env.example .env.local
   ```
   Then open `.env.local` and add:
   - `NEXT_PUBLIC_SUPABASE_URL` — found in your Supabase project settings under API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the `anon` public key from the same page

4. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
  app/
    (public)/     ← public-facing pages (home, gallery, viewer, articles, events, about)
    admin/        ← protected admin portal (/admin)
    api/          ← API routes
  components/
    ui/           ← reusable UI primitives
    admin/        ← admin-only components
    public/       ← public-site components
    Viewer360.jsx ← A-Frame 360° viewer (all A-Frame logic lives here only)
  lib/
    supabase.js   ← Supabase client initialization
    auth.js       ← auth helpers
```

## Technical Context

See [CLAUDE.md](./CLAUDE.md) for the full technical brief, including database schema, brand guidelines, coding conventions, and feature roadmap.
