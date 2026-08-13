// src/app/(public)/gallery/page.tsx
import type { Metadata } from "next";
import type { MediaItem } from "@/lib/types";
import GalleryGrid from "@/components/public/GalleryGrid";

export const metadata: Metadata = {
  title: "Gallery | Merrimack College Spatial Computing Lab",
  description:
    "Browse 360° photos and videos from Merrimack College study abroad trips and campus events.",
};

// Temporary placeholder rows so the filterable grid can be built and reviewed
// before the admin portal exists to publish real media. src/thumb are left
// blank on purpose — MediaCard already falls back to a placeholder icon.
const PLACEHOLDER_MEDIA: MediaItem[] = [
  {
    id: "placeholder-1",
    title: "Placeholder Title — Acropolis Overlook",
    src: "",
    thumb: null,
    type: "photo",
    category: "study_abroad",
    collection: "Greece 2026",
    description: "Placeholder description text goes here.",
    location: "Athens, Greece",
    date: "2026-03-10",
    featured: true,
  },
  {
    id: "placeholder-2",
    title: "Placeholder Title — Santorini Sunset Walkthrough",
    src: "",
    thumb: null,
    type: "video",
    category: "study_abroad",
    collection: "Greece 2026",
    description: "Placeholder description text goes here.",
    location: "Santorini, Greece",
    date: "2026-03-14",
    featured: false,
  },
  {
    id: "placeholder-3",
    title: "Placeholder Title — Chefchaouen Blue Streets",
    src: "",
    thumb: null,
    type: "photo",
    category: "study_abroad",
    collection: "Morocco 2025",
    description: "Placeholder description text goes here.",
    location: "Chefchaouen, Morocco",
    date: "2025-10-02",
    featured: false,
  },
  {
    id: "placeholder-4",
    title: "Placeholder Title — Sahara Desert",
    src: "",
    thumb: null,
    type: "video",
    category: "study_abroad",
    collection: "Morocco 2025",
    description: "Placeholder description text goes here.",
    location: "Merzouga, Morocco",
    date: "2025-10-05",
    featured: true,
  },
  {
    id: "placeholder-5",
    title: "Placeholder Title — Banff National Park Overlook",
    src: "",
    thumb: null,
    type: "photo",
    category: "study_abroad",
    collection: "Canada 2025",
    description: "Placeholder description text goes here.",
    location: "Banff, Alberta, Canada",
    date: "2025-01-18",
    featured: false,
  },
  {
    id: "placeholder-6",
    title: "Placeholder Title — Mack Gives Back Volunteer Day",
    src: "",
    thumb: null,
    type: "photo",
    category: "campus_events",
    collection: "Mack Gives Back 2026",
    description: "Placeholder description text goes here.",
    location: "Merrimack College Quad",
    date: "2026-04-18",
    featured: true,
  },
  {
    id: "placeholder-7",
    title: "Placeholder Title — Commencement Ceremony",
    src: "",
    thumb: null,
    type: "video",
    category: "campus_events",
    collection: "Commencement 2025",
    description: "Placeholder description text goes here.",
    location: "McQuade Library Quad",
    date: "2025-05-17",
    featured: false,
  },
  {
    id: "placeholder-8",
    title: "Placeholder Title — Move-In Day Welcome",
    src: "",
    thumb: null,
    type: "photo",
    category: "campus_events",
    collection: "Move in Day 2026",
    description: "Placeholder description text goes here.",
    location: "Merrimack College Residence Halls",
    date: "2026-08-29",
    featured: false,
  },
];

export default function GalleryPage() {
  return (
    <section className="bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="font-serif text-4xl text-[#00356A] dark:text-white">
            Gallery
          </h1>
          <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Placeholder text — browse every 360° photo and video from the
            Spatial Computing Lab, filterable by category and type.
          </p>
        </div>

        <GalleryGrid media={PLACEHOLDER_MEDIA} />
      </div>
    </section>
  );
}
