// src/components/Viewer360.jsx
// All A-Frame (WebXR) logic lives exclusively in this file.
// Do not import or use A-Frame anywhere else in the codebase.
"use client";

import { useEffect, useRef, useState } from "react";

// A-Frame touches `window`/`navigator` as soon as it's imported, so it can only
// be loaded in the browser. Importing it inside an effect (instead of at the
// top of the file) keeps this component safe to render on the server.
export default function Viewer360({ media }) {
  const [aframeReady, setAframeReady] = useState(false);
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  // Default drag direction is inverted from A-Frame's stock look-controls
  // (dragging left turns the view right, like turning your head) with a
  // button to flip back to the "grab and drag the scene" feel.
  const [reverseDrag, setReverseDrag] = useState(true);

  useEffect(() => {
    let cancelled = false;
    import("aframe").then(() => {
      if (!cancelled) setAframeReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
    <div className="relative h-full w-full bg-black">
      <a-scene
        embedded
        vr-mode-ui="enabled: true"
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
          camera
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
          className="absolute bottom-4 left-4 z-10 rounded-full bg-black/60 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-black/80"
        >
          {muted ? "Unmute" : "Mute"}
        </button>
      )}

      <button
        type="button"
        onClick={() => setReverseDrag((current) => !current)}
        className="absolute bottom-4 right-4 z-10 rounded-full bg-black/60 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-black/80"
      >
        {reverseDrag ? "Normal Controls" : "Invert Controls"}
      </button>
    </div>
  );
}
