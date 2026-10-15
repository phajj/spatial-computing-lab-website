// src/app/admin/(protected)/(guarded)/media/page.tsx
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import MediaManagerClient from "@/components/admin/MediaManagerClient";

// Matches the dashboard's cap — a simple limit rather than pagination is
// enough until the library grows past what one page can reasonably show.
const LIST_LIMIT = 200;

export default async function MediaManagerPage() {
  await requireAdmin();

  const [recent, collectionRows] = await Promise.all([
    prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
      select: {
        id: true,
        title: true,
        type: true,
        category: true,
        collection: true,
        published: true,
        createdAt: true,
      },
    }),
    // Distinct album/collection names already in use, to populate the
    // upload form's dropdown so staff can reuse an existing album instead
    // of retyping (and risking a typo that splits one album into two).
    prisma.media.findMany({
      where: { collection: { not: null } },
      distinct: ["collection"],
      select: { collection: true },
      orderBy: { collection: "asc" },
    }),
  ]);

  const collections = collectionRows
    .map((row) => row.collection)
    .filter((name): name is string => Boolean(name));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl text-[#00356A] dark:text-white">
        Media Manager
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Upload 360° photos and videos, review their details, and publish
        them to the public site. New uploads are saved as drafts until you
        publish them.
      </p>

      <div className="mt-6">
        <MediaManagerClient
          initialMedia={recent.map((item) => ({
            ...item,
            createdAt: item.createdAt.toISOString(),
          }))}
          initialCollections={collections}
        />
      </div>
    </div>
  );
}
