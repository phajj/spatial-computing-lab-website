// src/app/admin/(protected)/(guarded)/media/[id]/page.tsx
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import MediaEditForm from "@/components/admin/MediaEditForm";
import PublishingGuide from "@/components/admin/PublishingGuide";

export default async function MediaEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  const [media, collectionRows] = await Promise.all([
    prisma.media.findUnique({ where: { id } }),
    prisma.media.findMany({
      where: { collection: { not: null } },
      distinct: ["collection"],
      select: { collection: true },
      orderBy: { collection: "asc" },
    }),
  ]);

  if (!media) {
    notFound();
  }

  const collections = collectionRows
    .map((row) => row.collection)
    .filter((name): name is string => Boolean(name));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl text-[#00356A] dark:text-white">
        Edit Media
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Update details and publish this item to the public site, or unpublish
        it to pull it back to draft.
      </p>

      <div className="mt-6 space-y-6">
        <PublishingGuide />
        <MediaEditForm
          media={{
            id: media.id,
            title: media.title,
            src: media.src,
            type: media.type,
            category: media.category,
            collection: media.collection,
            description: media.description,
            location: media.location,
            date: media.date ? media.date.toISOString().slice(0, 10) : "",
            featured: media.featured,
            published: media.published,
            hotspots: media.hotspots,
          }}
          collections={collections}
        />
      </div>
    </div>
  );
}
