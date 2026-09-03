// src/components/admin/MediaUploadForm.tsx
"use client";

import { useRef, useState } from "react";
import type { MediaCategory, MediaType } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#00356A] focus:outline-none focus:ring-1 focus:ring-[#00356A] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

const CATEGORY_OPTIONS: { value: MediaCategory; label: string }[] = [
  { value: "study_abroad", label: "Study Abroad" },
  { value: "campus_events", label: "Campus Events" },
];

export type UploadedMedia = {
  id: string;
  title: string;
  type: string;
  category: string | null;
  collection: string | null;
  createdAt: string;
};

export default function MediaUploadForm({
  onUploaded,
}: {
  onUploaded?: (media: UploadedMedia) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MediaType>("photo");
  const [category, setCategory] = useState<MediaCategory | "">("");
  const [collection, setCollection] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [featured, setFeatured] = useState(false);
  const [hotspots, setHotspots] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickFile(selected: File | null) {
    setError(null);
    setSuccess(null);
    if (!selected) {
      setFile(null);
      return;
    }
    // Infer photo vs. video from the extension so staff don't have to set
    // it manually after dropping a file.
    const ext = selected.name.split(".").pop()?.toLowerCase() ?? "";
    if (["jpg", "jpeg", "png"].includes(ext)) setType("photo");
    else if (["mp4", "webm"].includes(ext)) setType("video");
    setFile(selected);
    if (!title) {
      setTitle(selected.name.replace(/\.[^.]+$/, ""));
    }
  }

  function resetForm() {
    setFile(null);
    setTitle("");
    setType("photo");
    setCategory("");
    setCollection("");
    setDescription("");
    setLocation("");
    setDate("");
    setFeatured(false);
    setHotspots("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
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

    const formData = new FormData();
    formData.set("file", file);
    formData.set("title", title.trim());
    formData.set("type", type);
    formData.set("category", category);
    formData.set("collection", collection.trim());
    formData.set("description", description.trim());
    formData.set("location", location.trim());
    formData.set("date", date);
    formData.set("featured", String(featured));
    formData.set("hotspots", hotspots.trim());

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
      let body: { media?: UploadedMedia; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // Fall through to the generic error below.
      }
      if (xhr.status !== 201 || !body.media) {
        setError(body.error ?? "Upload failed.");
        return;
      }
      setSuccess(`"${body.media.title}" uploaded as a draft.`);
      onUploaded?.(body.media);
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
            ? "border-[#00356A] bg-[#00356A]/5 dark:border-[#FFE000] dark:bg-[#FFE000]/5"
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
            onChange={(e) => setType(e.target.value as MediaType)}
            className={inputClass}
          >
            <option value="photo">Photo</option>
            <option value="video">Video</option>
          </select>
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
        </div>

        <div>
          <label htmlFor="collection" className={labelClass}>
            Collection
          </label>
          <input
            id="collection"
            placeholder="Greece Spring 2026"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            className={inputClass}
          />
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
            className="h-4 w-4 rounded border-gray-300 text-[#00356A] focus:ring-[#00356A]"
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
              className="h-full bg-[#00356A] transition-all dark:bg-[#FFE000]"
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
        disabled={progress !== null}
        className="mt-6 w-full rounded-full bg-[#FFE000] px-4 py-2 text-sm font-bold text-[#00356A] transition hover:bg-[#00356A] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {progress !== null ? "Uploading…" : "Upload as draft"}
      </button>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        New media is saved as a draft. Publishing comes with the next update
        to the admin portal.
      </p>
    </form>
  );
}
