// src/app/(public)/page.tsx
import Hero from "@/components/public/Hero";
import StatsBar from "@/components/public/StatsBar";
import FeaturedGrid from "@/components/public/FeaturedGrid";
import RecentAdditions from "@/components/public/RecentAdditions";
import { prisma } from "@/lib/db";
import type { MediaItem } from "@/lib/types";

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

const EMPTY_STATS = [
  { label: "360° Photos", value: 0 },
  { label: "360° Videos", value: 0 },
  { label: "Study Abroad Locations", value: 0 },
  { label: "Campus Events", value: 0 }
];

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

async function getHomePageData() {
  try {
    const [featuredRows, recentRows, allRows] = await Promise.all([
      prisma.media.findMany({
        where: { published: true, featured: true },
        orderBy: { date: "desc" },
        take: 6,
        select: MEDIA_SELECT,
      }),
      prisma.media.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: MEDIA_SELECT,
      }),
      prisma.media.findMany({
        where: { published: true },
        select: { type: true, category: true, location: true },
      }),
    ]);

    const photoCount = allRows.filter((row) => row.type === "photo").length;
    const videoCount = allRows.filter((row) => row.type === "video").length;
    const studyAbroadLocationCount = new Set(
      allRows
        .filter((row) => row.category === "study_abroad")
        .map((row) => row.location)
        .filter(Boolean)
    ).size;
    const campusEventCount = allRows.filter(
      (row) => row.category === "campus_events"
    ).length;

    return {
      featured: featuredRows.map(toMediaItem),
      recent: recentRows.map(toMediaItem),
      stats: [
        { label: "360° Photos", value: photoCount },
        { label: "360° Videos", value: videoCount },
        { label: "Study Abroad Locations", value: studyAbroadLocationCount },
        { label: "Campus Events", value: campusEventCount },
      ],
    };
  } catch (error) {
    console.error("Failed to load home page media:", error);
    return { featured: [] as MediaItem[], recent: [] as MediaItem[], stats: EMPTY_STATS };
  }
}

export default async function HomePage() {
  const { featured, recent, stats } = await getHomePageData();

  return (
    <>
      <Hero />
      <StatsBar stats={stats} />
      <FeaturedGrid media={featured} />
      <RecentAdditions media={recent} />
    </>
  );
}
