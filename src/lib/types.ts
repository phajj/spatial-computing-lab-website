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

// What the 360° viewer needs on top of a card: the view (yaw/pitch in
// degrees, start time in seconds) the item opens on.
export interface ViewerMediaItem extends MediaItem {
  viewYaw: number | null;
  viewPitch: number | null;
  viewTime: number | null;
}
