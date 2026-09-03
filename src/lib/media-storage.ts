// src/lib/media-storage.ts
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import type { MediaType } from "./types";

const PHOTO_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm"]);

export function getMediaDir(): string {
  const dir = process.env.MEDIA_DIR;
  if (!dir) {
    throw new Error("MEDIA_DIR environment variable is not set.");
  }
  return path.resolve(dir);
}

// Turns "Greece Spring 2026" into "greece-spring-2026" for use as a
// filesystem folder name — matches the "Destination Season Year"
// collection-naming convention in CLAUDE.md, and keeps the folder name
// made only of safe characters regardless of what staff type in.
export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}

function extensionFor(type: MediaType, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const allowed = type === "photo" ? PHOTO_EXTENSIONS : VIDEO_EXTENSIONS;
  if (!allowed.has(ext)) {
    throw new Error(
      type === "photo"
        ? "Photos must be .jpg, .jpeg, or .png."
        : "Videos must be .mp4 or .webm."
    );
  }
  return ext;
}

/**
 * Builds a safe on-disk destination for an upload and the public URL
 * (served from /media, see src/app/media/[...path]/route.ts) that will
 * reach it. Every path segment is generated here (a slugified collection
 * name, a random id) rather than taken verbatim from user input, and the
 * final resolved path is re-checked against MEDIA_DIR — belt-and-suspenders
 * against path traversal, since this touches the filesystem from
 * admin-submitted form fields.
 */
export function buildMediaDestination(
  type: MediaType,
  collection: string | null,
  originalName: string
) {
  const mediaDir = getMediaDir();
  const ext = extensionFor(type, originalName);
  const folder = collection ? slugify(collection) : "uncategorized";
  const filename = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(mediaDir, folder);
  const absPath = path.join(dir, filename);

  if (!absPath.startsWith(mediaDir + path.sep)) {
    throw new Error("Resolved upload path escaped MEDIA_DIR.");
  }

  return { absPath, dir, publicSrc: `/media/${folder}/${filename}` };
}

export async function saveMediaFile(
  dir: string,
  absPath: string,
  buffer: Buffer
) {
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(absPath, buffer);
}
