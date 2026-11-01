// src/lib/random-thumbnail.ts
// Browser-only: draws a thumbnail from a random view of a 360° file before
// it's uploaded, so every new item has a thumbnail without a server-side
// image or video toolchain.
import type { MediaType } from "./types";

export const THUMB_WIDTH = 1280;
export const THUMB_HEIGHT = 720;
const THUMB_QUALITY = 0.85;
const LOAD_TIMEOUT_MS = 15000;

export type PickedView = {
  blob: Blob;
  yaw: number;
  pitch: number;
  time: number | null;
};

// A-Frame's sky sphere puts the image's horizontal position `u` (0 at the
// left edge, 1 at the right) at camera yaw -360·u - 90 degrees. Pitch 0 is
// the image's middle row (the horizon).
function yawForImageCenter(u: number): number {
  const yaw = -360 * u - 90;
  return ((((yaw + 180) % 360) + 360) % 360) - 180;
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timed out")), LOAD_TIMEOUT_MS)
    ),
  ]);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = url;
  return img.decode().then(() => img);
}

function loadVideoFrame(url: string): Promise<{ video: HTMLVideoElement; time: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onerror = () => reject(new Error("Video could not be decoded"));
    video.onloadedmetadata = () => {
      // Stay clear of the first and last 10%, which are often fades or
      // the camera operator setting up.
      const time = video.duration * (0.1 + Math.random() * 0.8);
      video.onseeked = () => resolve({ video, time });
      video.currentTime = time;
    };
    video.src = url;
  });
}

// Copies a 90°-wide strip around the horizon, centered on `u`, wrapping
// around the image's left/right seam when needed.
function drawStrip(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  u: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = THUMB_WIDTH;
  canvas.height = THUMB_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const cropWidth = sourceWidth / 4;
  const cropHeight = (cropWidth * THUMB_HEIGHT) / THUMB_WIDTH;
  const top = (sourceHeight - cropHeight) / 2;
  const left = (u * sourceWidth - cropWidth / 2 + sourceWidth) % sourceWidth;
  const firstWidth = Math.min(cropWidth, sourceWidth - left);
  const scale = THUMB_WIDTH / cropWidth;

  ctx.drawImage(source, left, top, firstWidth, cropHeight, 0, 0, firstWidth * scale, THUMB_HEIGHT);
  if (firstWidth < cropWidth) {
    const rest = cropWidth - firstWidth;
    ctx.drawImage(source, 0, top, rest, cropHeight, firstWidth * scale, 0, rest * scale, THUMB_HEIGHT);
  }
  return canvas;
}

function toJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed"))),
      "image/jpeg",
      THUMB_QUALITY
    )
  );
}

/**
 * Returns a thumbnail from a random direction (and, for video, a random
 * moment) of the file, or null if this browser can't decode it — the upload
 * then goes ahead without one and staff can pick a view on the edit page.
 */
export async function makeRandomThumbnail(
  file: File,
  type: MediaType
): Promise<PickedView | null> {
  const url = URL.createObjectURL(file);
  try {
    const u = Math.random();
    if (type === "photo") {
      const img = await withTimeout(loadImage(url));
      const canvas = drawStrip(img, img.naturalWidth, img.naturalHeight, u);
      return { blob: await toJpeg(canvas), yaw: yawForImageCenter(u), pitch: 0, time: null };
    }
    const { video, time } = await withTimeout(loadVideoFrame(url));
    const canvas = drawStrip(video, video.videoWidth, video.videoHeight, u);
    return { blob: await toJpeg(canvas), yaw: yawForImageCenter(u), pitch: 0, time };
  } catch (error) {
    console.warn("Could not generate a thumbnail:", error);
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
