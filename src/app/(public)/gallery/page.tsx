// src/app/(public)/gallery/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import type { MediaItem } from "@/lib/types";
import GalleryGrid from "@/components/public/GalleryGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery | Merrimack College Spatial Computing Lab",
  description:
    "Browse 360° photos and videos from Merrimack College study abroad trips and campus events.",
};

const MEDIA_SELECT = {
  id: true,
  title: true,
  src: true,
  thumb: true,
  type: true,
  category: true,
  collection: true,
  description: true,
  location: true,
  date: true,
  featured: true,
} as const;

function toMediaItem(row: {
  id: string;
  title: string;
  src: string;
  thumb: string | null;
  type: string;
  category: string | null;
  collection: string | null;
  description: string | null;
  location: string | null;
  date: Date | null;
  featured: boolean;
}): MediaItem {
  return {
    ...row,
    type: row.type as MediaItem["type"],
    category: row.category as MediaItem["category"],
    date: row.date ? row.date.toISOString() : null,
  };
}

async function getGalleryMedia(): Promise<{
  media: MediaItem[];
  loadError: boolean;
}> {
  try {
    const rows = await prisma.media.findMany({
      where: { published: true },
      orderBy: { date: "desc" },
      select: MEDIA_SELECT,
    });
    return { media: rows.map(toMediaItem), loadError: false };
  } catch (error) {
    console.error("Failed to load media for gallery:", error);
    return { media: [], loadError: true };
  }
}

export default async function GalleryPage() {
  const { media, loadError } = await getGalleryMedia();

  return (
    <section className="bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="font-serif text-4xl text-[#00356A] dark:text-white">
            Gallery
          </h1>
          <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Browse every 360° photo and video from the Spatial Computing Lab,
            filterable by category and type.
          </p>
        </div>

        {loadError ? (
          <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            We couldn&apos;t load the gallery just now. Please try again shortly.
          </p>
        ) : (
          <GalleryGrid media={media} />
        )}
      </div>
    </section>
  );
}
