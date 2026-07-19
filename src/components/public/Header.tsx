// src/components/public/Header.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const navLinkClass =
  "text-sm font-medium text-[#00356A] transition hover:text-[#00356A]/70 dark:text-white dark:hover:text-[#FFE000]";

const mobileLinkClass =
  "rounded px-2 py-2 text-sm font-medium text-[#00356A] hover:bg-black/5 dark:text-white dark:hover:bg-white/10";

const viewerButtonClass =
  "rounded-full bg-[#FFE000] px-4 py-1.5 text-sm font-bold text-[#00356A] transition hover:bg-[#00356A] hover:text-white";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-[#00356A]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setMenuOpen(false)}
        >
          <span className="rounded bg-[#FFE000] px-2 py-1 text-xs font-bold text-[#00356A]">
            360°
          </span>
          <span className="font-serif text-lg leading-tight text-[#00356A] dark:text-white sm:text-xl">
            Spatial Computing Lab
          </span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <Link href="/" className={navLinkClass}>
            Home
          </Link>
          <Link href="/gallery" className={navLinkClass}>
            Gallery
          </Link>
          <Link href="/viewer" className={viewerButtonClass}>
            360° Viewer
          </Link>
          <Link href="/about" className={navLinkClass}>
            About
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex flex-col gap-1.5 p-2 sm:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span className="h-0.5 w-6 bg-[#00356A] dark:bg-white" />
            <span className="h-0.5 w-6 bg-[#00356A] dark:bg-white" />
            <span className="h-0.5 w-6 bg-[#00356A] dark:bg-white" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-black/5 px-4 pb-4 dark:border-white/10 sm:hidden">
          <Link href="/" onClick={() => setMenuOpen(false)} className={mobileLinkClass}>
            Home
          </Link>
          <Link
            href="/gallery"
            onClick={() => setMenuOpen(false)}
            className={mobileLinkClass}
          >
            Gallery
          </Link>
          <Link
            href="/viewer"
            onClick={() => setMenuOpen(false)}
            className="my-1 rounded-full bg-[#FFE000] px-4 py-2 text-center text-sm font-bold text-[#00356A]"
          >
            360° Viewer
          </Link>
          <Link
            href="/about"
            onClick={() => setMenuOpen(false)}
            className={mobileLinkClass}
          >
            About
          </Link>
        </nav>
      )}
    </header>
  );
}
