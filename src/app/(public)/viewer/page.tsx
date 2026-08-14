// src/app/(public)/viewer/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import type { MediaItem } from "@/lib/types";
import ViewerClient from "@/components/public/ViewerClient";

export const metadata: Metadata = {
  title: "360° Viewer | Merrimack College Spatial Computing Lab",
  description:
    "Step inside immersive 360° photos and videos from Merrimack College study abroad trips and campus events.",
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

async function getViewerMedia(): Promise<{ media: MediaItem[]; loadError: boolean }> {
  try {
    const rows = await prisma.media.findMany({
      where: { published: true },
      orderBy: { date: "asc" },
      select: MEDIA_SELECT,
    });
    return { media: rows.map(toMediaItem), loadError: false };
  } catch (error) {
    console.error("Failed to load media for viewer:", error);
    return { media: [], loadError: true };
  }
}

export default async function ViewerPage() {
  const { media, loadError } = await getViewerMedia();

  return (
    <section className="bg-white dark:bg-gray-950">
      <ViewerClient media={media} loadError={loadError} />
    </section>
  );
}
