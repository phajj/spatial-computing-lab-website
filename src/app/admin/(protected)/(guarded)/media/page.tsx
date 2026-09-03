// src/app/admin/(protected)/(guarded)/media/page.tsx
import { prisma } from "@/lib/db";
import MediaManagerClient from "@/components/admin/MediaManagerClient";

const RECENT_LIMIT = 10;

export default async function MediaManagerPage() {
  const recent = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    take: RECENT_LIMIT,
    select: {
      id: true,
      title: true,
      type: true,
      category: true,
      collection: true,
      published: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl text-[#00356A] dark:text-white">
        Media Manager
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Upload a new 360° photo or video and fill in its details. New
        uploads are saved as drafts — publishing them on the public site is
        a separate step, coming next.
      </p>

      <div className="mt-6">
        <MediaManagerClient
          initialMedia={recent.map((item) => ({
            ...item,
            createdAt: item.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
