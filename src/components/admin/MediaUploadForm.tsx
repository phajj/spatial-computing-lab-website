// src/components/admin/MediaUploadForm.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Viewer360 from "@/components/Viewer360";
import ThumbnailPreview from "@/components/admin/ThumbnailPreview";
import { makeRandomThumbnail, type PickedView } from "@/lib/random-thumbnail";
import type { AlbumOption, MediaCategory, MediaType } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-mc-blue focus:outline-none focus:ring-1 focus:ring-mc-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

const CATEGORY_OPTIONS: { value: MediaCategory; label: string }[] = [
  { value: "study_abroad", label: "Study Abroad" },
  { value: "campus_events", label: "Campus Events" },
];

// Sentinel <option> value that switches the album dropdown into
// "type a new name" mode. Not a real collection name.
const NEW_ALBUM = "__new__";

export type UploadedMedia = {
  id: string;
  title: string;
  type: string;
  category: string | null;
  collection: string | null;
  createdAt: string;
};

export default function MediaUploadForm({
  albums,
  onUploaded,
}: {
  albums: AlbumOption[];
  onUploaded?: (media: UploadedMedia, album: AlbumOption | null) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MediaType>("photo");
  const [category, setCategory] = useState<MediaCategory | "">("");
  // `collectionChoice` holds the <select> value: "" (none), an existing
  // album name, or NEW_ALBUM. `newCollection` is the free-text name typed
  // when NEW_ALBUM is chosen.
  const [collectionChoice, setCollectionChoice] = useState("");
  const [newCollection, setNewCollection] = useState("");
  const [newAlbumCategory, setNewAlbumCategory] = useState<MediaCategory | "">("");

  // Picking an album fills in Category with that album's label; staff can
  // still change Category for this one item afterwards.
  function chooseAlbum(value: string) {
    setCollectionChoice(value);
    if (value === NEW_ALBUM) {
      setCategory(newAlbumCategory);
      return;
    }
    const album = albums.find((a) => a.name === value);
    if (album) setCategory(album.category ?? "");
  }

  function chooseNewAlbumCategory(value: MediaCategory | "") {
    setNewAlbumCategory(value);
    setCategory(value);
  }
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [featured, setFeatured] = useState(false);
  const [hotspots, setHotspots] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [preparing, setPreparing] = useState(false);
  // A local URL for the chosen file, so the 360° preview can show it before
  // it's uploaded, and the view picked in that preview (if any).
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pickedView, setPickedView] = useState<PickedView | null>(null);
  const [pickedPreviewUrl, setPickedPreviewUrl] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [reverseDrag, setReverseDrag] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!fileUrl) return;
    return () => URL.revokeObjectURL(fileUrl);
  }, [fileUrl]);

  useEffect(() => {
    if (!pickedPreviewUrl) return;
    return () => URL.revokeObjectURL(pickedPreviewUrl);
  }, [pickedPreviewUrl]);

  function handlePickView(view: PickedView) {
    setPickedView(view);
    setPickedPreviewUrl(URL.createObjectURL(view.blob));
  }

  function clearPickedView() {
    setPickedView(null);
    setPickedPreviewUrl(null);
  }

  function pickFile(selected: File | null) {
    setError(null);
    setSuccess(null);
    clearPickedView();
    if (!selected) {
      setFile(null);
      setFileUrl(null);
      return;
    }
    // Infer photo vs. video from the extension so staff don't have to set
    // it manually after dropping a file.
    const ext = selected.name.split(".").pop()?.toLowerCase() ?? "";
    if (["jpg", "jpeg", "png"].includes(ext)) setType("photo");
    else if (["mp4", "webm"].includes(ext)) setType("video");
    setFile(selected);
    setFileUrl(URL.createObjectURL(selected));
    if (!title) {
      setTitle(selected.name.replace(/\.[^.]+$/, ""));
    }
  }

  function resetForm() {
    setFile(null);
    setFileUrl(null);
    clearPickedView();
    setTitle("");
    setType("photo");
    setCategory("");
    setCollectionChoice("");
    setNewCollection("");
    setNewAlbumCategory("");
    setDescription("");
    setLocation("");
    setDate("");
    setFeatured(false);
    setHotspots("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file) {
      setError("Choose or drop a file to upload.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (hotspots.trim()) {
      try {
        JSON.parse(hotspots);
      } catch {
        setError("Hotspots must be valid JSON.");
        return;
      }
    }

    if (collectionChoice === NEW_ALBUM && !newCollection.trim()) {
      setError("Enter a name for the new album, or choose an existing one.");
      return;
    }
    const collectionValue =
      collectionChoice === NEW_ALBUM ? newCollection.trim() : collectionChoice;

    const formData = new FormData();
    formData.set("file", file);
    formData.set("title", title.trim());
    formData.set("type", type);
    formData.set("category", category);
    formData.set("collection", collectionValue);
    if (collectionChoice === NEW_ALBUM) {
      formData.set("albumCategory", newAlbumCategory);
    }
    formData.set("description", description.trim());
    formData.set("location", location.trim());
    formData.set("date", date);
    formData.set("featured", String(featured));
    formData.set("hotspots", hotspots.trim());

    // Use the view picked in the preview, or else a random direction (and
    // moment, for video), so every item starts with a thumbnail.
    let thumbnail = pickedView;
    if (!thumbnail) {
      setPreparing(true);
      thumbnail = await makeRandomThumbnail(file, type);
      setPreparing(false);
    }
    if (thumbnail) {
      formData.set("thumb", thumbnail.blob, "thumb.jpg");
      formData.set("viewYaw", String(thumbnail.yaw));
      formData.set("viewPitch", String(thumbnail.pitch));
      if (thumbnail.time !== null) {
        formData.set("viewTime", String(thumbnail.time));
      }
    }

    // XHR (rather than fetch) so upload progress is available — 360°
    // video files can be large enough that a bare "Uploading…" spinner
    // isn't reassuring.
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      setProgress(null);
      let body: { media?: UploadedMedia; album?: AlbumOption | null; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // Fall through to the generic error below.
      }
      if (xhr.status !== 201 || !body.media) {
        setError(body.error ?? "Upload failed.");
        return;
      }
      setSuccess(
        `"${body.media.title}" uploaded as a draft. Click Publish in the list below when it's ready to go live, or click its title to change the thumbnail first.`
      );
      onUploaded?.(body.media, body.album ?? null);
      resetForm();
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("Upload failed — check your connection and try again.");
    };
    xhr.send(formData);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900"
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pickFile(e.dataTransfer.files[0] ?? null);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-6 cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition ${
          dragging
            ? "border-mc-blue bg-mc-blue/5 dark:border-mc-gold dark:bg-mc-gold/5"
            : "border-gray-300 dark:border-gray-700"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.mp4,.webm"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <p className="text-sm text-gray-800 dark:text-gray-200">
            {file.name}{" "}
            <span className="text-gray-500 dark:text-gray-400">
              ({(file.size / (1024 * 1024)).toFixed(1)} MB)
            </span>
          </p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag and drop a 360° photo or video here, or click to browse.
            <br />
            <span className="text-xs">JPEG, PNG, MP4, or WebM.</span>
          </p>
        )}
      </div>

      {file && fileUrl && (
        <div className="mb-6">
          <p className={labelClass}>
            Thumbnail &amp; starting view{" "}
            <span className="font-normal text-gray-500 dark:text-gray-400">
              (optional — skip it and a random view is used)
            </span>
          </p>
          <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
            Drag to look around
            {type === "video" ? " and use the Frame slider to choose a moment" : ""}
            , then click <strong>Use this view as thumbnail</strong>. The
            public 360&deg; Viewer will open on the same view.
          </p>
          <div className="aspect-video w-full overflow-hidden rounded-md">
            <Viewer360
              key={`${fileUrl}-${type}`}
              media={{
                id: "upload-preview",
                title,
                src: fileUrl,
                thumb: null,
                type,
                viewYaw: null,
                viewPitch: null,
                viewTime: null,
              }}
              muted={muted}
              setMuted={setMuted}
              reverseDrag={reverseDrag}
              setReverseDrag={setReverseDrag}
              pickerMode
              onPickView={handlePickView}
            />
          </div>
          {pickedPreviewUrl && (
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <ThumbnailPreview src={pickedPreviewUrl} label="Chosen thumbnail" />
              <button
                type="button"
                onClick={clearPickedView}
                className="mb-5 rounded-full border border-mc-blue/20 px-3 py-1 text-xs font-medium text-mc-blue transition hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
              >
                Use a random view instead
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className={labelClass}>
            Title
          </label>
          <input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="type" className={labelClass}>
            Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => {
              setType(e.target.value as MediaType);
              clearPickedView();
            }}
            className={inputClass}
          >
            <option value="photo">Photo</option>
            <option value="video">Video</option>
          </select>
        </div>

        <div>
          <label htmlFor="collection" className={labelClass}>
            Album
          </label>
          <select
            id="collection"
            value={collectionChoice}
            onChange={(e) => chooseAlbum(e.target.value)}
            className={inputClass}
          >
            <option value="">— None —</option>
            {albums.map((album) => (
              <option key={album.id} value={album.name}>
                {album.name}
              </option>
            ))}
            <option value={NEW_ALBUM}>+ New album…</option>
          </select>
          {collectionChoice === NEW_ALBUM && (
            <>
              <input
                aria-label="New album name"
                placeholder="Greece Spring 2026"
                value={newCollection}
                onChange={(e) => setNewCollection(e.target.value)}
                className={`${inputClass} mt-2`}
              />
              <select
                aria-label="New album label"
                value={newAlbumCategory}
                onChange={(e) => chooseNewAlbumCategory(e.target.value as MediaCategory | "")}
                className={`${inputClass} mt-2`}
              >
                <option value="">Album label: none</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Album label: {opt.label}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        <div>
          <label htmlFor="category" className={labelClass}>
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as MediaCategory | "")
            }
            className={inputClass}
          >
            <option value="">— None —</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Defaults to the album&apos;s label.
          </p>
        </div>

        <div>
          <label htmlFor="location" className={labelClass}>
            Location
          </label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="date" className={labelClass}>
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="hotspots" className={labelClass}>
            Hotspots{" "}
            <span className="font-normal text-gray-500 dark:text-gray-400">
              (optional, advanced — raw JSON)
            </span>
          </label>
          <textarea
            id="hotspots"
            rows={2}
            value={hotspots}
            onChange={(e) => setHotspots(e.target.value)}
            placeholder='[{"pitch": 0, "yaw": 0, "label": "Entrance"}]'
            className={`${inputClass} font-mono text-xs`}
          />
        </div>

        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="featured"
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-mc-blue focus:ring-mc-blue"
          />
          <label
            htmlFor="featured"
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            Feature on the home page
          </label>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400"
        >
          {error}
        </p>
      )}
      {success && (
        <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
          {success}
        </p>
      )}
      {progress !== null && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
            <div
              className="h-full bg-mc-blue transition-all dark:bg-mc-gold"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Uploading… {progress}%
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={progress !== null || preparing}
        className="mt-6 w-full rounded-full bg-mc-gold px-4 py-2 text-sm font-bold text-mc-blue transition hover:bg-mc-blue hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {preparing
          ? "Preparing thumbnail…"
          : progress !== null
            ? "Uploading…"
            : "Upload as draft"}
      </button>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        New media is saved as a draft and won&apos;t appear on the public site
        until you publish it.
      </p>
    </form>
  );
}
