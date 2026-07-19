// src/components/public/RecentAdditions.tsx
import type { MediaItem } from "@/lib/types";
import MediaCard from "./MediaCard";

export default function RecentAdditions({ media }: { media: MediaItem[] }) {
  return (
    <section className="bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-col gap-2">
          <h2 className="font-serif text-3xl text-[#00356A] dark:text-white">
            Recently Added
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            The latest uploads from the Spatial Computing Lab.
          </p>
        </div>

        {media.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {media.map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            Nothing published yet. New 360° photos and videos will appear here
            as soon as they go live.
          </p>
        )}
      </div>
    </section>
  );
}
