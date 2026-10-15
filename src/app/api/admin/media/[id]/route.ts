// src/app/api/admin/media/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isTrustedOrigin } from "@/lib/origin-check";
import type { MediaCategory, MediaType } from "@/lib/types";

const TYPES: MediaType[] = ["photo", "video"];
const CATEGORIES: MediaCategory[] = ["study_abroad", "campus_events"];

function readOptionalString(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

// Edits an existing media row's metadata and/or flips its published flag.
// This never touches the file on disk or `src` — only the admin upload
// flow (POST /api/admin/media) writes files, per CLAUDE.md's media-origin
// convention. Toggling `published` here is what makes a draft appear on
// the public site, since every public page filters on `published: true`.
export async function PATCH(
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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if ("title" in body) {
    const title = readOptionalString(body, "title");
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    data.title = title;
  }

  if ("type" in body) {
    if (!TYPES.includes(body.type as MediaType)) {
      return NextResponse.json(
        { error: "Type must be photo or video." },
        { status: 400 }
      );
    }
    data.type = body.type;
  }

  if ("category" in body) {
    const category = readOptionalString(body, "category");
    if (category && !CATEGORIES.includes(category as MediaCategory)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }
    data.category = category;
  }

  if ("collection" in body) {
    data.collection = readOptionalString(body, "collection");
  }

  if ("description" in body) {
    data.description = readOptionalString(body, "description");
  }

  if ("location" in body) {
    data.location = readOptionalString(body, "location");
  }

  if ("date" in body) {
    const dateInput = readOptionalString(body, "date");
    if (dateInput === null) {
      data.date = null;
    } else if (dateInput !== undefined) {
      const parsed = new Date(dateInput);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid date." }, { status: 400 });
      }
      data.date = parsed;
    }
  }

  if ("featured" in body) {
    if (typeof body.featured !== "boolean") {
      return NextResponse.json(
        { error: "Featured must be true or false." },
        { status: 400 }
      );
    }
    data.featured = body.featured;
  }

  if ("published" in body) {
    if (typeof body.published !== "boolean") {
      return NextResponse.json(
        { error: "Published must be true or false." },
        { status: 400 }
      );
    }
    data.published = body.published;
  }

  if ("hotspots" in body) {
    const hotspotsInput = readOptionalString(body, "hotspots");
    if (hotspotsInput) {
      try {
        JSON.parse(hotspotsInput);
      } catch {
        return NextResponse.json(
          { error: "Hotspots must be valid JSON." },
          { status: 400 }
        );
      }
    }
    data.hotspots = hotspotsInput;
  }

  const media = await prisma.media.update({ where: { id }, data });
  return NextResponse.json({ media });
}
