// src/app/(public)/page.tsx
import Hero from "@/components/public/Hero";
import StatsBar from "@/components/public/StatsBar";
import FeaturedGrid from "@/components/public/FeaturedGrid";
import RecentAdditions from "@/components/public/RecentAdditions";
import { supabase } from "@/lib/supabase";
import type { MediaItem } from "@/lib/types";

const MEDIA_COLUMNS =
  "id, title, src, thumb, type, category, collection, description, location, date, featured";

const EMPTY_STATS = [
  { label: "360° Experiences", value: 0 },
  { label: "Collections", value: 0 },
  { label: "Locations Captured", value: 0 },
];

async function getHomePageData() {
  try {
    const [featuredRes, recentRes, allRes] = await Promise.all([
      supabase
        .from("media")
        .select(MEDIA_COLUMNS)
        .eq("published", true)
        .eq("featured", true)
        .order("date", { ascending: false })
        .limit(6),
      supabase
        .from("media")
        .select(MEDIA_COLUMNS)
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("media").select("collection, location").eq("published", true),
    ]);

    if (featuredRes.error) throw featuredRes.error;
    if (recentRes.error) throw recentRes.error;
    if (allRes.error) throw allRes.error;

    const allRows = allRes.data ?? [];
    const collectionCount = new Set(
      allRows.map((row) => row.collection).filter(Boolean)
    ).size;
    const locationCount = new Set(
      allRows.map((row) => row.location).filter(Boolean)
    ).size;

    return {
      featured: (featuredRes.data ?? []) as MediaItem[],
      recent: (recentRes.data ?? []) as MediaItem[],
      stats: [
        { label: "360° Experiences", value: allRows.length },
        { label: "Collections", value: collectionCount },
        { label: "Locations Captured", value: locationCount },
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
