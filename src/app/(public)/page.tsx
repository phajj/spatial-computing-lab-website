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
  { label: "360° Photos", value: 0 },
  { label: "360° Videos", value: 0 },
  { label: "Study Abroad Locations", value: 0 },
  { label: "Campus Events", value: 0 }
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
      supabase.from("media").select("type, category, location").eq("published", true),
    ]);

    if (featuredRes.error) throw featuredRes.error;
    if (recentRes.error) throw recentRes.error;
    if (allRes.error) throw allRes.error;

    const allRows = allRes.data ?? [];
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
      featured: (featuredRes.data ?? []) as MediaItem[],
      recent: (recentRes.data ?? []) as MediaItem[],
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
