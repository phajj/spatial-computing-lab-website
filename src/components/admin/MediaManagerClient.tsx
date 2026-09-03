// src/components/admin/MediaManagerClient.tsx
"use client";

import { useState } from "react";
import MediaUploadForm, { type UploadedMedia } from "./MediaUploadForm";

type MediaRow = {
  id: string;
  title: string;
  type: string;
  category: string | null;
  collection: string | null;
  published: boolean;
  createdAt: string;
};

const RECENT_LIMIT = 10;

// Matches the "MM-DD-YYYY" format used by the dashboard and admin CLI
// scripts, for consistency across the admin portal.
function formatDate(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${date.getFullYear()}`;
}

export default function MediaManagerClient({
  initialMedia,
}: {
  initialMedia: MediaRow[];
}) {
  const [media, setMedia] = useState(initialMedia);

  function handleUploaded(uploaded: UploadedMedia) {
    setMedia((current) =>
      [{ ...uploaded, published: false }, ...current].slice(0, RECENT_LIMIT)
    );
  }

  return (
    <div className="space-y-8">
      <MediaUploadForm onUploaded={handleUploaded} />

      <div>
        <h2 className="font-serif text-lg text-[#00356A] dark:text-white">
          Recently added
        </h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-gray-900">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-black/10 text-gray-600 dark:border-white/10 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Collection</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {media.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No media yet — upload your first file above.
                  </td>
                </tr>
              ) : (
                media.map((item) => (
                  <tr key={item.id} className="text-gray-800 dark:text-gray-200">
                    <td className="px-4 py-3">{item.title}</td>
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
