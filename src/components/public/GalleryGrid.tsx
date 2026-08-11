// src/components/public/GalleryGrid.tsx
"use client";

import { useMemo, useState } from "react";
import type { MediaCategory, MediaItem, MediaType } from "@/lib/types";
import MediaCard from "./MediaCard";

type CategoryFilter = MediaCategory | "all";
type TypeFilter = MediaType | "all";

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "study_abroad", label: "Study Abroad" },
  { value: "campus_events", label: "Campus Events" },
];

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "photo", label: "Photos" },
  { value: "video", label: "Videos" },
];

const pillBase =
  "rounded-full px-4 py-1.5 text-sm font-medium transition border";

const pillActive = "border-transparent bg-[#FFE000] font-bold text-[#00356A]";

const pillInactive =
  "border-gray-300 text-gray-600 hover:border-[#00356A] hover:text-[#00356A] dark:border-white/20 dark:text-gray-300 dark:hover:border-white dark:hover:text-white";

export default function GalleryGrid({ media }: { media: MediaItem[] }) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");

  const filtered = useMemo(() => {
    return media.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesType = type === "all" || item.type === type;
      return matchesCategory && matchesType;
    });
  }, [media, category, type]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setCategory(filter.value)}
              className={`${pillBase} ${
                category === filter.value ? pillActive : pillInactive
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setType(filter.value)}
              className={`${pillBase} ${
                type === filter.value ? pillActive : pillInactive
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <MediaCard key={item.id} media={item} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          No 360° media matches these filters yet.
        </p>
      )}
    </div>
  );
}
