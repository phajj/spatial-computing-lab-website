// src/lib/types.ts

export type MediaType = "photo" | "video";
export type MediaCategory = "study_abroad" | "campus_events";

export interface MediaItem {
  id: string;
  title: string;
  src: string;
  thumb: string | null;
  type: MediaType;
  category: MediaCategory | null;
  collection: string | null;
  description: string | null;
  location: string | null;
  date: string | null;
  featured: boolean;
}
