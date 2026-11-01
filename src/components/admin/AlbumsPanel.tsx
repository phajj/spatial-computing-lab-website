// src/components/admin/AlbumsPanel.tsx
"use client";

import { useState } from "react";
import type { AlbumOption, MediaCategory } from "@/lib/types";

const CATEGORY_OPTIONS: { value: MediaCategory; label: string }[] = [
  { value: "study_abroad", label: "Study Abroad" },
  { value: "campus_events", label: "Campus Events" },
];

export type AlbumRow = AlbumOption & { itemCount: number };

export default function AlbumsPanel({
  albums,
  onLabelChanged,
}: {
  albums: AlbumRow[];
  onLabelChanged: (album: AlbumRow, category: MediaCategory | null) => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeLabel(album: AlbumRow, value: MediaCategory | "") {
    const category = value || null;
    const labelName =
      CATEGORY_OPTIONS.find((opt) => opt.value === category)?.label ?? "no label";
    if (
      album.itemCount > 0 &&
      !window.confirm(
        `Label "${album.name}" as ${labelName}? This also sets the category of all ${album.itemCount} item${album.itemCount === 1 ? "" : "s"} in the album.`
      )
    ) {
      return;
    }

    setError(null);
    setPendingId(album.id);
    try {
      const res = await fetch(`/api/admin/albums/${album.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't update the album label.");
        return;
      }
      onLabelChanged(album, category);
    } catch {
      setError("Couldn't update the album label — check your connection and try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <h2 className="font-extrabold text-lg text-mc-blue dark:text-white">Albums</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        An album&apos;s label is the default category for anything added to
        it. Changing it here also updates every item already in the album.
        Albums labeled Study Abroad are what the home page counts as Study
        Abroad Locations.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <div className="mt-3 overflow-x-auto rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-gray-900">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-black/10 text-gray-600 dark:border-white/10 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Album</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Label</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {albums.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No albums yet — choose &ldquo;+ New album…&rdquo; when uploading.
                </td>
              </tr>
            ) : (
              albums.map((album) => (
                <tr key={album.id} className="text-gray-800 dark:text-gray-200">
                  <td className="px-4 py-3 font-medium">{album.name}</td>
                  <td className="px-4 py-3">{album.itemCount}</td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Label for ${album.name}`}
                      value={album.category ?? ""}
                      disabled={pendingId === album.id}
                      onChange={(e) => changeLabel(album, e.target.value as MediaCategory | "")}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-mc-blue focus:outline-none focus:ring-1 focus:ring-mc-blue disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">— None —</option>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
