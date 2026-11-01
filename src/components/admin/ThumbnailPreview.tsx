// src/components/admin/ThumbnailPreview.tsx
import Image from "next/image";

export default function ThumbnailPreview({
  src,
  label,
}: {
  src: string | null;
  label: string;
}) {
  return (
    <figure className="w-48">
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-mc-blue">
        {src ? (
          // unoptimized: Next's image optimizer fetches without the admin's
          // session cookie, so it can't load a draft's thumbnail.
          <Image src={src} alt={label} fill unoptimized sizes="192px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-white/70">
            No thumbnail yet
          </div>
        )}
      </div>
      <figcaption className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</figcaption>
    </figure>
  );
}
