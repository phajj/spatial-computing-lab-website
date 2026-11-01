// src/lib/albums.ts
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./db";
import type { AlbumOption, MediaCategory } from "./types";

type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

export const CATEGORIES: MediaCategory[] = ["study_abroad", "campus_events"];

export function isCategory(value: unknown): value is MediaCategory {
  return CATEGORIES.includes(value as MediaCategory);
}

/**
 * Returns the album called `name`, creating it with `category` as its label
 * if it doesn't exist yet. An existing album's label is left alone: it's
 * changed only from the Media Manager's Albums panel.
 */
export async function ensureAlbum(
  db: PrismaClientOrTx,
  name: string,
  category: MediaCategory | null
) {
  return db.album.upsert({
    where: { name },
    create: { name, category },
    update: {},
  });
}

// Every album, for the upload/edit forms' Album dropdowns.
export async function getAlbumOptions(): Promise<AlbumOption[]> {
  const albums = await prisma.album.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true },
  });
  return albums.map((album) => ({
    ...album,
    category: isCategory(album.category) ? album.category : null,
  }));
}
