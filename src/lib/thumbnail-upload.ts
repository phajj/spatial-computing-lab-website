// src/lib/thumbnail-upload.ts
import type { MediaType } from "./types";

// Thumbnails are 1280×720 JPEGs drawn in the admin's browser, so a few
// hundred KB is typical; this only bounds a bad or malicious request.
const MAX_THUMB_BYTES = 5 * 1024 * 1024;

export type ThumbnailUpload = {
  buffer: Buffer;
  viewYaw: number;
  viewPitch: number;
  viewTime: number | null;
};

function readNumber(formData: FormData, key: string): number | null {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Reads the optional `thumb` file and its `viewYaw`/`viewPitch`/`viewTime`
 * fields from an admin form submission. Returns null when no thumbnail was
 * sent, or an error message when one was sent but isn't usable.
 */
export async function readThumbnailUpload(
  formData: FormData,
  type: MediaType
): Promise<ThumbnailUpload | null | { error: string }> {
  const file = formData.get("thumb");
  if (!(file instanceof File) || file.size === 0) return null;

  if (file.size > MAX_THUMB_BYTES) {
    return { error: "Thumbnail is too large (max 5MB)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // JPEG files always start with these three bytes; checking them stops a
  // non-image from being saved under a .jpg name.
  if (buffer.length < 3 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
    return { error: "Thumbnail must be a JPEG image." };
  }

  const yaw = readNumber(formData, "viewYaw");
  const pitch = readNumber(formData, "viewPitch");
  if (yaw === null || pitch === null) {
    return { error: "Thumbnail view angle is missing." };
  }
  const time = type === "video" ? readNumber(formData, "viewTime") : null;

  return {
    buffer,
    // Wrap yaw into -180..180 and keep pitch between straight down and
    // straight up, matching what the viewer's look controls allow.
    viewYaw: ((((yaw + 180) % 360) + 360) % 360) - 180,
    viewPitch: Math.max(-90, Math.min(90, pitch)),
    viewTime: time !== null && time >= 0 ? time : null,
  };
}
