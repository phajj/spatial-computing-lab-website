// src/app/api/admin/media/route.ts
import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildMediaDestination, saveMediaFile } from "@/lib/media-storage";
import type { MediaCategory, MediaType } from "@/lib/types";

// Generous cap for 360° video while still bounding disk usage from a bad
// or malicious upload.
const MAX_FILE_BYTES = 500 * 1024 * 1024;

const TYPES: MediaType[] = ["photo", "video"];
const CATEGORIES: MediaCategory[] = ["study_abroad", "campus_events"];

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

// Creates a new media row from a drag-and-drop upload. New media always
// lands as a draft (published defaults to false in the schema) — the
// publish workflow is the next piece of the admin portal to build, per
// CLAUDE.md's build order.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const file = formData.get("file");
  const title = readField(formData, "title");
  const type = readField(formData, "type");
  const category = readField(formData, "category") || null;
  const collection = readField(formData, "collection") || null;
  const description = readField(formData, "description") || null;
  const location = readField(formData, "location") || null;
  const dateInput = readField(formData, "date");
  const featured = readField(formData, "featured") === "true";
  const hotspotsInput = readField(formData, "hotspots");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!TYPES.includes(type as MediaType)) {
    return NextResponse.json(
      { error: "Type must be photo or video." },
      { status: 400 }
    );
  }
  if (category && !CATEGORIES.includes(category as MediaCategory)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "File is too large (max 500MB)." },
      { status: 400 }
    );
  }

  let hotspots: string | null = null;
  if (hotspotsInput) {
    try {
      JSON.parse(hotspotsInput);
    } catch {
      return NextResponse.json(
        { error: "Hotspots must be valid JSON." },
        { status: 400 }
      );
    }
    hotspots = hotspotsInput;
  }

  let date: Date | null = null;
  if (dateInput) {
    const parsed = new Date(dateInput);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    }
    date = parsed;
  }

  let destination;
  try {
    destination = buildMediaDestination(type as MediaType, collection, file.name);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not process upload." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await saveMediaFile(destination.dir, destination.absPath, buffer);

  try {
    const media = await prisma.media.create({
      data: {
        title,
        src: destination.publicSrc,
        type,
        category,
        collection,
        description,
        location,
        date,
        featured,
        hotspots,
        published: false,
      },
    });
    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    // Don't leave an orphaned file on disk if the metadata row failed.
    await fs.unlink(destination.absPath).catch(() => {});
    console.error("Failed to create media row:", error);
    return NextResponse.json(
      { error: "Upload saved but the database record failed. Try again." },
      { status: 500 }
    );
  }
}
