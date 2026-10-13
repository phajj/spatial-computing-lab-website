// src/components/admin/MediaManagerClient.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import MediaUploadForm, { type UploadedMedia } from "./MediaUploadForm";
import PublishingGuide from "./PublishingGuide";

type MediaRow = {
  id: string;
  title: string;
  type: string;
  category: string | null;
  collection: string | null;
  published: boolean;
  createdAt: string;
};

type StatusFilter = "all" | "draft" | "published";

// Matches the "MM-DD-YYYY" format used by the dashboard and admin CLI
// scripts, for consistency across the admin portal.
function formatDate(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${date.getFullYear()}`;
}

export default function MediaManagerClient({
  initialMedia,
  initialCollections,
}: {
  initialMedia: MediaRow[];
  initialCollections: string[];
}) {
  const [media, setMedia] = useState(initialMedia);
  const [collections, setCollections] = useState(initialCollections);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleUploaded(uploaded: UploadedMedia) {
    setMedia((current) => [{ ...uploaded, published: false }, ...current]);
    // If this upload created a brand-new album, add it to the dropdown so
    // the next upload in this session can reuse it without a page reload.
    if (uploaded.collection && !collections.includes(uploaded.collection)) {
      const name = uploaded.collection;
      setCollections((current) =>
        [...current, name].sort((a, b) => a.localeCompare(b))
      );
    }
  }

  async function setPublished(item: MediaRow, published: boolean) {
    if (
      !published &&
      !window.confirm(
        `Unpublish "${item.title}"? It will be removed from the public site and returned to draft.`
      )
    ) {
      return;
    }

    setError(null);
    setPendingId(item.id);
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't update publish status.");
        return;
      }
      setMedia((current) =>
        current.map((row) => (row.id === item.id ? { ...row, published } : row))
      );
    } catch {
      setError("Couldn't update publish status — check your connection and try again.");
    } finally {
      setPendingId(null);
    }
  }

  const draftCount = media.filter((item) => !item.published).length;
  const counts: Record<StatusFilter, number> = {
    all: media.length,
    draft: draftCount,
    published: media.length - draftCount,
  };
  const visible = media.filter((item) =>
    filter === "all" ? true : filter === "published" ? item.published : !item.published
  );

  return (
    <div className="space-y-8">
      <PublishingGuide defaultOpen={media.length === 0} />

      <MediaUploadForm collections={collections} onUploaded={handleUploaded} />

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg text-[#00356A] dark:text-white">
            All media
          </h2>
          <div className="flex gap-1 rounded-full border border-black/10 p-1 dark:border-white/10">
            {(["all", "draft", "published"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                  filter === value
                    ? "bg-[#00356A] text-white dark:bg-[#FFE000] dark:text-[#00356A]"
                    : "text-gray-600 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/10"
                }`}
              >
                {value === "draft" ? "Drafts" : value} ({counts[value]})
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400"
          >
            {error}
          </p>
        )}

        <div className="mt-3 overflow-x-auto rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-gray-900">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-black/10 text-gray-600 dark:border-white/10 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Collection</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {media.length === 0
                      ? "No media yet — upload your first file above."
                      : filter === "draft"
                        ? "No drafts — everything has been published."
                        : "Nothing published yet."}
                  </td>
                </tr>
              ) : (
                visible.map((item) => (
                  <tr key={item.id} className="text-gray-800 dark:text-gray-200">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/media/${item.id}`}
                        className="font-medium text-[#00356A] hover:underline dark:text-white"
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize">{item.type}</td>
                    <td className="px-4 py-3">{item.collection ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          item.published
                            ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300"
                            : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }
                      >
                        {item.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/media/${item.id}`}
                          className="rounded-full border border-[#00356A]/20 px-3 py-1 text-xs font-medium text-[#00356A] transition hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={pendingId === item.id}
                          onClick={() => setPublished(item, !item.published)}
                          className={
                            item.published
                              ? "rounded-full border border-[#00356A]/20 px-3 py-1 text-xs font-medium text-[#00356A] transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                              : "rounded-full bg-[#FFE000] px-3 py-1 text-xs font-bold text-[#00356A] transition hover:bg-[#00356A] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                          }
                        >
                          {pendingId === item.id
                            ? "Saving…"
                            : item.published
                              ? "Unpublish"
                              : "Publish"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
