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
  const sceneRef = useRef(null);
  const [muted, setMuted] = useState(true);
  // Default drag direction is inverted from A-Frame's stock look-controls
  // (dragging left turns the view right, like turning your head) with a
  // toggle to switch back to the "grab and drag the scene" feel.
  const [reverseDrag, setReverseDrag] = useState(true);
  const [isImmersive, setIsImmersive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("aframe").then(() => {
      if (!cancelled) setAframeReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // A-Frame's built-in enter-VR button hides itself once inside VR/fullscreen
  // (it assumes Escape is how you leave), which strands anyone using a mouse.
  // We disable that built-in UI below and drive `sceneEl.enterVR()` /
  // `exitVR()` ourselves from a button that always stays on screen. Those
  // scene methods still do the real work (WebXR session on a headset,
  // fullscreen fallback otherwise) — we're only replacing the button, not
  // the underlying behavior.
  useEffect(() => {
    const sceneEl = sceneRef.current;
    if (!aframeReady || !sceneEl) return;

    function handleEnterVR() {
      setIsImmersive(true);
    }
    function handleExitVR() {
      setIsImmersive(false);
    }

    sceneEl.addEventListener("enter-vr", handleEnterVR);
    sceneEl.addEventListener("exit-vr", handleExitVR);
    return () => {
      sceneEl.removeEventListener("enter-vr", handleEnterVR);
      sceneEl.removeEventListener("exit-vr", handleExitVR);
    };
  }, [aframeReady]);

  function toggleFullscreen() {
    const sceneEl = sceneRef.current;
    if (!sceneEl) return;
    if (isImmersive) {
      sceneEl.exitVR();
    } else {
      sceneEl.enterVR();
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
    <div className="relative h-full w-full bg-black">
      <a-scene
        ref={sceneRef}
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

      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-black/60 py-2 pl-3 pr-2 text-xs font-bold uppercase tracking-wide text-white">
        <span>Inverted Controls</span>
        <button
          type="button"
          role="switch"
          aria-checked={reverseDrag}
          aria-label="Toggle inverted drag controls"
          onClick={() => setReverseDrag((current) => !current)}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
            reverseDrag ? "bg-[#FFE000]" : "bg-white/30"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              reverseDrag ? "translate-x-[18px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 z-10 rounded-full bg-black/60 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-black/80"
      >
        {isImmersive ? "Exit Fullscreen" : "Fullscreen"}
      </button>
    </div>
  );
}
