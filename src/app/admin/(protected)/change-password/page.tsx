// src/app/admin/(protected)/change-password/page.tsx
"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#00356A] focus:outline-none focus:ring-1 focus:ring-[#00356A] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    setSubmitting(true);
    const { error: changeError } = await authClient.changePassword({
      currentPassword,
      newPassword,
      // Keeps this session signed in but signs out every other device —
      // the same "revoke on password change" behavior as the CLI scripts.
      revokeOtherSessions: true,
    });
    setSubmitting(false);

    if (changeError) {
      setError(
        changeError.code === "INVALID_PASSWORD"
          ? "Current password is incorrect."
          : (changeError.message ?? "Could not change password.")
      );
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccess(true);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl text-[#00356A] dark:text-white">
        Change Password
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Enter your current password, then your new password twice.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-lg border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900"
      >
        <div className="mb-4">
          <label htmlFor="currentPassword" className={labelClass}>
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="newPassword" className={labelClass}>
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
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

        {success && (
          <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
            Password changed. You&rsquo;ve been kept signed in here; other
            devices have been signed out.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[#FFE000] px-4 py-2 text-sm font-bold text-[#00356A] transition hover:bg-[#00356A] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Changing password…" : "Change password"}
        </button>
      </form>
    </div>
  );
}
