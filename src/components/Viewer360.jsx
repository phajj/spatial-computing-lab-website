// src/components/Viewer360.jsx
// All A-Frame (WebXR) logic lives exclusively in this file.
// Do not import or use A-Frame anywhere else in the codebase.
"use client";

import { useEffect, useRef, useState } from "react";

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.1;

// A-Frame touches `window`/`navigator` as soon as it's imported, so it can only
// be loaded in the browser. Importing it inside an effect (instead of at the
// top of the file) keeps this component safe to render on the server.
export default function Viewer360({ media }) {
  const [aframeReady, setAframeReady] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [muted, setMuted] = useState(true);
  // Default drag direction is inverted from A-Frame's stock look-controls
  // (dragging left turns the view right, like turning your head) with a
  // toggle to switch back to the "grab and drag the scene" feel.
  const [reverseDrag, setReverseDrag] = useState(true);
  const [isImmersive, setIsImmersive] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;
    import("aframe").then(() => {
      if (!cancelled) setAframeReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // A-Frame's built-in enter-VR button fullscreens only its internal
  // <canvas>, which excludes the rest of this component's DOM (our overlay
  // buttons live outside that canvas) — so anything we render disappears the
  // moment fullscreen kicks in. Using the Fullscreen API directly on the
  // outer container instead keeps our whole overlay, buttons included, part
  // of what's on screen while fullscreen is active.
  useEffect(() => {
    function handleFullscreenChange() {
      setIsImmersive(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Scroll-to-zoom needs a non-passive listener so preventDefault() can stop
  // the page itself from scrolling while the cursor is over the viewer;
  // React's onWheel prop is passive by default and can't do that.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function handleWheel(event) {
      event.preventDefault();
      setZoom((current) => {
        const next = current + (event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
        return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
      });
    }
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [aframeReady]);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (containerRef.current) {
      containerRef.current.requestFullscreen();
    }
  }

  if (!media) return null;

  if (!aframeReady) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#1a4f8a]">
        <p className="text-sm font-medium text-white/80">
          Loading 360&deg; viewer&hellip;
        </p>
      </div>
    );
  }

  const assetId = `viewer-media-${media.id}`;

  return (
    <div ref={containerRef} className="relative h-full w-full bg-black">
      {/* A-Frame injects its own enter-VR/fullscreen button (.a-enter-vr) directly
          into the DOM outside React's control. vr-mode-ui="enabled: false" is
          supposed to suppress it, but it still renders in some cases and clicking
          it engages A-Frame's own fullscreen simulation, which hides the rest of
          this overlay. Force it off so our custom button below is the only one. */}
      <style jsx global>{`
        .a-enter-vr,
        .a-enter-ar,
        .a-orientation-modal {
          display: none !important;
        }
      `}</style>
      <a-scene
        embedded
        vr-mode-ui="enabled: false"
        loading-screen="dotsColor: #FFE000; backgroundColor: #00356A"
      >
        {media.type === "video" && (
          <a-assets timeout="10000">
            <video
              id={assetId}
              ref={videoRef}
              src={media.src}
              poster={media.thumb || undefined}
              loop
              muted={muted}
              autoPlay
              playsInline
              crossOrigin="anonymous"
            />
          </a-assets>
        )}

        {media.type === "video" ? (
          <a-videosphere src={`#${assetId}`} />
        ) : (
          <a-sky src={media.src} crossorigin="anonymous" />
        )}

        <a-entity
          camera={`zoom: ${zoom}`}
          look-controls={`reverseMouseDrag: ${reverseDrag}`}
          wasd-controls="enabled: false"
          position="0 1.6 0"
        />
      </a-scene>

      {media.type === "video" && (
        <button
          type="button"
          onClick={() => {
            setMuted((current) => {
              const next = !current;
              if (videoRef.current) videoRef.current.muted = next;
              return next;
            });
          }}
          className="absolute bottom-4 left-4 z-[10000] rounded-full bg-black/60 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-black/80"
        >
          {muted ? "Unmute" : "Mute"}
        </button>
      )}

      <div className="absolute right-4 top-4 z-[10000] flex items-center gap-2 rounded-full bg-black/60 py-2 pl-3 pr-2 text-xs font-bold uppercase tracking-wide text-white">
        <span>Inverted Controls</span>
        <button
          type="button"
          role="switch"
          aria-checked={reverseDrag}
          aria-label="Toggle inverted drag controls"
          onClick={() => setReverseDrag((current) => !current)}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
            reverseDrag ? "bg-[#1a4f8a]" : "bg-white/30"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              reverseDrag ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="absolute right-4 top-1/2 z-[10000] flex -translate-y-1/2 flex-col items-center gap-2 rounded-full bg-black/60 px-3 py-3 text-xs font-bold uppercase tracking-wide text-white">
        <span>Zoom</span>
        <div className="relative h-28 w-8">
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={ZOOM_STEP}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            aria-label="Zoom level"
            className="absolute left-1/2 top-1/2 h-1.5 w-24 -translate-x-1/2 -translate-y-1/2 -rotate-90 cursor-pointer appearance-none rounded-full bg-white/30 accent-[#FFE000]"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isImmersive ? "Exit fullscreen" : "Enter fullscreen"}
        className="absolute bottom-4 right-4 z-[10000] rounded-full bg-black/60 p-3 text-white transition hover:bg-[#1a4f8a]"
      >
        {isImmersive ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9V4.5M15 9H19.5M15 9L20.25 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15v4.5M15 15h4.5m-4.5 0l5.25 5.25"
            />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3.75h4.5m-4.5 0v4.5m0-4.5L9 9m11.25-5.25h-4.5m4.5 0v4.5m0-4.5L15 9M3.75 20.25h4.5m-4.5 0v-4.5m0 4.5L9 15m11.25 5.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
