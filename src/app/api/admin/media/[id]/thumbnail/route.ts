// src/app/api/admin/media/[id]/thumbnail/route.ts
import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildThumbnailDestination,
  mediaSrcToAbsPath,
  saveMediaFile,
} from "@/lib/media-storage";
import { isTrustedOrigin } from "@/lib/origin-check";
import { readThumbnailUpload } from "@/lib/thumbnail-upload";
import type { MediaType } from "@/lib/types";

// Replaces a media item's thumbnail with a view the admin picked in the
// edit page's 360° preview, and saves that view as where the public viewer
// opens. Only drafts can be changed: to re-pick the thumbnail of a live
// item, staff unpublish it, pick a new view, and publish again.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isTrustedOrigin(req.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.media.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Media not found." }, { status: 404 });
  }
  if (existing.published) {
    return NextResponse.json(
      { error: "Unpublish this item before changing its thumbnail." },
      { status: 409 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form submission." },
      { status: 400 }
    );
  }

  const thumbnail = await readThumbnailUpload(formData, existing.type as MediaType);
  if (!thumbnail) {
    return NextResponse.json({ error: "A thumbnail is required." }, { status: 400 });
  }
  if ("error" in thumbnail) {
    return NextResponse.json({ error: thumbnail.error }, { status: 400 });
  }

  const destination = buildThumbnailDestination();
  await saveMediaFile(destination.dir, destination.absPath, thumbnail.buffer);

  let media;
  try {
    media = await prisma.media.update({
      where: { id },
      data: {
        thumb: destination.publicSrc,
        viewYaw: thumbnail.viewYaw,
        viewPitch: thumbnail.viewPitch,
        viewTime: thumbnail.viewTime,
      },
    });
  } catch (error) {
    await fs.unlink(destination.absPath).catch(() => {});
    console.error("Failed to update thumbnail:", error);
    return NextResponse.json(
      { error: "Could not save the thumbnail. Try again." },
      { status: 500 }
    );
  }

  // Only remove the old file once the row points at the new one, and only
  // if it's a generated thumbnail — never a media file it happened to share.
  const oldPath = existing.thumb?.startsWith("/media/_thumbs/")
    ? mediaSrcToAbsPath(existing.thumb)
    : null;
  if (oldPath) {
    await fs.unlink(oldPath).catch(() => {});
  }

  return NextResponse.json({ media });
}
