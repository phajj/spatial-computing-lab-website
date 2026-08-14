// src/app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await signIn.email({
      email: email.trim().toLowerCase(),
      password,
    });

    setSubmitting(false);

    if (signInError) {
      setError("Incorrect email or password.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-3 rounded bg-[#FFE000] px-2 py-1 text-xs font-bold text-[#00356A]">
            360°
          </span>
          <h1 className="font-serif text-2xl text-[#00356A] dark:text-white">
            Admin Portal
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Spatial Computing Lab
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900"
        >
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#00356A] focus:outline-none focus:ring-1 focus:ring-[#00356A] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#00356A] focus:outline-none focus:ring-1 focus:ring-[#00356A] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#FFE000] px-4 py-2 text-sm font-bold text-[#00356A] transition hover:bg-[#00356A] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
