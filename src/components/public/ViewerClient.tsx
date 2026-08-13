// src/components/public/ViewerClient.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MediaItem } from "@/lib/types";
import Viewer360 from "@/components/Viewer360";

const CATEGORY_LABELS: Record<string, string> = {
  study_abroad: "Study Abroad",
  campus_events: "Campus Events",
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// The viewer supports two hash-based deep-link formats: `#viewer=<id>` for a
// specific piece of media, and `#collection=<slug>` to open a trip/event's
// first item. `URLSearchParams` happily parses either (or both together).
function parseHash(hash: string): { viewerId: string | null; collectionSlug: string | null } {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return {
    viewerId: params.get("viewer"),
    collectionSlug: params.get("collection"),
  };
}

export default function ViewerClient({
  media,
  loadError,
}: {
  media: MediaItem[];
  loadError: boolean;
}) {
  const [hashParams, setHashParams] = useState<{
    viewerId: string | null;
    collectionSlug: string | null;
  }>({ viewerId: null, collectionSlug: null });

  // Hash changes (clicking a thumbnail, using browser back/forward, or landing
  // on a shared link) are the source of truth for which item is open. The
  // hash itself is never available during server rendering, so the very
  // first client render briefly falls back to the most recent item below
  // until this effect runs and corrects it.
  useEffect(() => {
    function syncFromHash() {
      setHashParams(parseHash(window.location.hash));
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const activeItem = useMemo(() => {
    if (media.length === 0) return null;

    if (hashParams.viewerId) {
      const byId = media.find((item) => item.id === hashParams.viewerId);
      if (byId) return byId;
    }

    if (hashParams.collectionSlug) {
      const byCollection = media.find(
        (item) => item.collection && slugify(item.collection) === hashParams.collectionSlug
      );
      if (byCollection) return byCollection;
    }

    return media[media.length - 1];
  }, [media, hashParams]);

  const collectionItems = useMemo(() => {
    if (!activeItem?.collection) return [];
    return media.filter((item) => item.collection === activeItem.collection);
  }, [media, activeItem]);

  useEffect(() => {
    if (activeItem) {
      document.title = `${activeItem.title} · 360° Viewer | Merrimack College Spatial Computing Lab`;
    }
  }, [activeItem]);

  function goToId(id: string) {
    window.location.hash = `viewer=${id}`;
  }

  if (media.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          {loadError
            ? "The 360° viewer couldn't reach the media library. Please try again shortly."
            : "Nothing published yet. New 360° photos and videos will appear here as soon as the lab publishes them."}
        </p>
        <Link
          href="/gallery"
          className="mt-6 inline-block rounded-md bg-[#FFE000] px-6 py-3 text-sm font-bold text-[#00356A] transition hover:bg-[#00356A] hover:text-white"
        >
          Back to Gallery
        </Link>
      </div>
    );
  }

  if (!activeItem) return null;

  const currentIndex = collectionItems.findIndex((item) => item.id === activeItem.id);
  const prevItem = currentIndex > 0 ? collectionItems[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < collectionItems.length - 1
      ? collectionItems[currentIndex + 1]
      : null;
  const categoryLabel = activeItem.category
    ? CATEGORY_LABELS[activeItem.category] ?? activeItem.category
    : null;

  return (
    <div>
      <div className="relative h-[65vh] min-h-[420px] w-full sm:h-[80vh]">
        <Viewer360 key={activeItem.id} media={activeItem} />

        {(prevItem || nextItem) && (
          <>
            <button
              type="button"
              onClick={() => prevItem && goToId(prevItem.id)}
              disabled={!prevItem}
              aria-label="Previous in collection"
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => nextItem && goToId(nextItem.id)}
              disabled={!nextItem}
              aria-label="Next in collection"
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className="bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {categoryLabel && (
              <span className="rounded-full bg-[#FFE000] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[#00356A]">
                {categoryLabel}
              </span>
            )}
            <span className="rounded-full bg-[#00356A] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white dark:bg-[#1a4f8a]">
              360&deg; {activeItem.type === "video" ? "Video" : "Photo"}
            </span>
          </div>

          <h1 className="mt-4 font-serif text-3xl text-[#00356A] dark:text-white sm:text-4xl">
            {activeItem.title}
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {[activeItem.collection, activeItem.location, activeItem.date]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {activeItem.description && (
            <p className="mt-4 max-w-3xl text-gray-600 dark:text-gray-300">
              {activeItem.description}
            </p>
          )}

          <Link
            href="/gallery"
            className="mt-6 inline-block text-sm font-bold text-[#00356A] hover:underline dark:text-[#FFE000]"
          >
            &larr; Back to Gallery
          </Link>

          {collectionItems.length > 1 && (
            <div className="mt-10">
              <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[#00356A] dark:text-white">
                More from {activeItem.collection}
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {collectionItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToId(item.id)}
                    className={`relative aspect-video w-32 shrink-0 overflow-hidden rounded-md border-2 transition sm:w-40 ${
                      item.id === activeItem.id
                        ? "border-[#FFE000]"
                        : "border-transparent hover:border-[#00356A]/40 dark:hover:border-white/40"
                    }`}
                  >
                    {item.thumb ? (
                      <Image
                        src={item.thumb}
                        alt={item.title}
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#1a4f8a] text-xs text-white/70">
                        {item.type === "video" ? "Video" : "Photo"}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
