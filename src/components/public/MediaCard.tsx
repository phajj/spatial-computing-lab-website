// src/components/public/MediaCard.tsx
import Image from "next/image";
import Link from "next/link";
import type { MediaItem } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  study_abroad: "Study Abroad",
  campus_events: "Campus Events",
};

function formatCategory(category: string | null): string | null {
  if (!category) return null;
  return (
    CATEGORY_LABELS[category] ??
    category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export default function MediaCard({ media }: { media: MediaItem }) {
  const categoryLabel = formatCategory(media.category);

  return (
    <Link
      href={`/viewer#viewer=${media.id}`}
      className="group block overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[#1a4f8a]">
        {media.thumb ? (
          <Image
            src={media.thumb}
            alt={media.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/60">
            <svg
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l3.159 3.159M3 8.25a3 3 0 013-3h12a3 3 0 013 3v9a3 3 0 01-3 3H6a3 3 0 01-3-3v-9z"
              />
            </svg>
          </div>
        )}

        {categoryLabel && (
          <span className="absolute left-3 top-3 rounded-full bg-[#FFE000] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[#00356A]">
            {categoryLabel}
          </span>
        )}

        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
          360° {media.type === "video" ? "Video" : "Photo"}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-serif text-lg text-[#00356A] dark:text-white">
          {media.title}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {[media.collection, media.location].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
}
