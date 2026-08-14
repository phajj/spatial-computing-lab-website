// src/components/admin/AdminNav.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/components/public/ThemeToggle";
import { signOut } from "@/lib/auth-client";

const navItems = [{ href: "/admin", label: "Dashboard" }];

const navLinkClass =
  "rounded px-3 py-1.5 text-sm font-medium text-[#00356A] transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10";

const activeNavLinkClass =
  "rounded-full bg-[#FFE000] px-3 py-1.5 text-sm font-bold text-[#00356A]";

const buttonLinkClass =
  "rounded-full border border-[#00356A]/20 px-3 py-1.5 text-sm font-medium text-[#00356A] transition hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10";

const activeButtonLinkClass =
  "rounded-full bg-[#FFE000] px-3 py-1.5 text-sm font-bold text-[#00356A]";

export default function AdminNav({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-black/5 bg-white dark:border-white/10 dark:bg-[#00356A]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="rounded bg-[#FFE000] px-2 py-1 text-xs font-bold text-[#00356A]">
            360°
          </span>
          <span className="font-serif text-lg leading-tight text-[#00356A] dark:text-white">
            Admin Portal
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? activeNavLinkClass : navLinkClass}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/" className={navLinkClass}>
            View Public Site
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-gray-600 dark:text-gray-300 sm:inline">
            {adminEmail}
          </span>
          <Link
            href="/admin/change-password"
            className={
              isActive("/admin/change-password")
                ? activeButtonLinkClass
                : buttonLinkClass
            }
          >
            Change Password
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className={`${buttonLinkClass} disabled:opacity-60`}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
