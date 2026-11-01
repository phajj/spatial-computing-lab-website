// src/app/api/admin/albums/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isCategory } from "@/lib/albums";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isTrustedOrigin } from "@/lib/origin-check";

// Changes an album's label and applies it to every item already in the
// album, so the album and its media agree. Both writes share a transaction
// so a failure can't leave them half-updated.
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

  const existing = await prisma.album.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Album not found." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const category = body.category === "" || body.category === null ? null : body.category;
  if (category !== null && !isCategory(category)) {
    return NextResponse.json({ error: "Invalid album label." }, { status: 400 });
  }

  const [album, { count }] = await prisma.$transaction([
    prisma.album.update({ where: { id }, data: { category } }),
    prisma.media.updateMany({
      where: { collection: existing.name },
      data: { category },
    }),
  ]);

  return NextResponse.json({ album, updatedCount: count });
}
