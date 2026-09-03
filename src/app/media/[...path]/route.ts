// src/app/media/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { getMediaDir } from "@/lib/media-storage";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

// Serves files straight off MEDIA_DIR (server-local disk, not the
// `public/` folder Next.js normally serves statically — see CLAUDE.md's
// server topology notes). Every `media.src` value in the database is a
// path under here, e.g. "/media/greece-spring-2026/lighthouse.jpg".
// Handles Range requests so 360° video can be scrubbed instead of only
// playing straight through.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  let mediaDir: string;
  try {
    mediaDir = getMediaDir();
  } catch {
    return new NextResponse("Media storage is not configured.", {
      status: 500,
    });
  }

  const absPath = path.join(mediaDir, ...segments);
  // Next decodes each dynamic-segment component before this handler sees
  // it, so this re-check (after path.join's own ".."-collapsing) is what
  // actually stops a "../../" traversal attempt from escaping MEDIA_DIR.
  if (absPath !== mediaDir && !absPath.startsWith(mediaDir + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  let stat;
  try {
    stat = await fsp.stat(absPath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!stat.isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(absPath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
  const range = request.headers.get("range");

  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Number(match[2]) : stat.size - 1;

    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start > end ||
      end >= stat.size
    ) {
      return new NextResponse("Range not satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${stat.size}` },
      });
    }

    const stream = fs.createReadStream(absPath, { start, end });
    return new NextResponse(
      Readable.toWeb(stream) as unknown as ReadableStream,
      {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Content-Length": String(end - start + 1),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      }
    );
  }

  const stream = fs.createReadStream(absPath);
  return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
