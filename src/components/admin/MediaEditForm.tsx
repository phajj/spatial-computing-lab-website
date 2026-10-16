// src/components/admin/MediaEditForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MediaCategory, MediaType } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-mc-blue focus:outline-none focus:ring-1 focus:ring-mc-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

const CATEGORY_OPTIONS: { value: MediaCategory; label: string }[] = [
  { value: "study_abroad", label: "Study Abroad" },
  { value: "campus_events", label: "Campus Events" },
];

const NEW_ALBUM = "__new__";

type EditableMedia = {
  id: string;
  title: string;
  src: string;
  type: string;
  category: string | null;
  collection: string | null;
  description: string | null;
  location: string | null;
  date: string;
  featured: boolean;
  published: boolean;
  hotspots: string | null;
};

export default function MediaEditForm({
  media,
  collections,
}: {
  media: EditableMedia;
  collections: string[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(media.title);
  const [type, setType] = useState<MediaType>(media.type as MediaType);
  const [category, setCategory] = useState<MediaCategory | "">(
    (media.category as MediaCategory) ?? ""
  );
  const knownCollection =
    media.collection && collections.includes(media.collection);
  const [collectionChoice, setCollectionChoice] = useState(
    media.collection ? (knownCollection ? media.collection : NEW_ALBUM) : ""
  );
  const [newCollection, setNewCollection] = useState(
    media.collection && !knownCollection ? media.collection : ""
  );
  const [description, setDescription] = useState(media.description ?? "");
  const [location, setLocation] = useState(media.location ?? "");
  const [date, setDate] = useState(media.date);
  const [featured, setFeatured] = useState(media.featured);
  const [published, setPublished] = useState(media.published);
  const [saveTarget, setSaveTarget] = useState<boolean | null>(null);
  const [hotspots, setHotspots] = useState(media.hotspots ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save(published);
  }

  async function save(nextPublished: boolean) {
    if (
      published &&
      !nextPublished &&
      !window.confirm(
        "Unpublish this item? It will be removed from the public site and returned to draft."
      )
    ) {
      return;
    }
    setError(null);
    setSuccess(null);

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

    setSaveTarget(nextPublished);
    try {
      const res = await fetch(`/api/admin/media/${media.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type,
          category,
          collection: collectionValue,
          description: description.trim(),
          location: location.trim(),
          date,
          featured,
          published: nextPublished,
          hotspots: hotspots.trim(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Save failed.");
        return;
      }
      setPublished(nextPublished);
      setSuccess(
        nextPublished === published
          ? "Saved."
          : nextPublished
            ? "Published — this item is now live on the public site."
            : "Unpublished — this item is back to draft."
      );
      router.refresh();
    } catch {
      setError("Save failed — check your connection and try again.");
    } finally {
      setSaveTarget(null);
    }
  }

  const saving = saveTarget !== null;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900"
    >
      <div
        className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md p-4 ${
          published
            ? "bg-green-50 dark:bg-green-950"
            : "bg-gray-100 dark:bg-gray-800"
        }`}
      >
        <div>
          <p
            className={`text-sm font-medium ${
              published
                ? "text-green-800 dark:text-green-300"
                : "text-gray-800 dark:text-gray-200"
            }`}
          >
            {published ? "Published" : "Draft"}
          </p>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            {published
              ? "Visible on the public Home, Gallery, and 360° Viewer pages."
              : "Only signed-in admins can see this. Publish it to show it on the public site."}
          </p>
        </div>
        {published && (
          <a
            href={`/viewer#viewer=${media.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-mc-blue/20 px-3 py-1 text-xs font-medium text-mc-blue transition hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
          >
            View on public site
          </a>
        )}
      </div>

      <div className="mb-6 rounded-md border border-dashed border-gray-300 p-4 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {media.src}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          File can&apos;t be replaced here — delete and re-upload to change it.
        </p>
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
            onChange={(e) => setCategory(e.target.value as MediaCategory | "")}
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
            Album
          </label>
          <select
            id="collection"
            value={collectionChoice}
            onChange={(e) => setCollectionChoice(e.target.value)}
            className={inputClass}
          >
            <option value="">— None —</option>
            {collections.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value={NEW_ALBUM}>+ New album…</option>
          </select>
          {collectionChoice === NEW_ALBUM && (
            <input
              aria-label="New album name"
              placeholder="Greece Spring 2026"
              value={newCollection}
              onChange={(e) => setNewCollection(e.target.value)}
              className={`${inputClass} mt-2`}
            />
          )}
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

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {published ? (
          <>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-mc-gold px-4 py-2 text-sm font-bold text-mc-blue transition hover:bg-mc-blue hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveTarget === true ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => save(false)}
              className="rounded-full border border-mc-blue/20 px-4 py-2 text-sm font-medium text-mc-blue transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
            >
              {saveTarget === false ? "Saving…" : "Save & unpublish"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={saving}
              onClick={() => save(true)}
              className="rounded-full bg-mc-gold px-4 py-2 text-sm font-bold text-mc-blue transition hover:bg-mc-blue hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveTarget === true ? "Saving…" : "Save & publish"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full border border-mc-blue/20 px-4 py-2 text-sm font-medium text-mc-blue transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
            >
              {saveTarget === false ? "Saving…" : "Save draft"}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => router.push("/admin/media")}
          className="rounded-full border border-mc-blue/20 px-4 py-2 text-sm font-medium text-mc-blue transition hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
        >
          Back to Media Manager
        </button>
      </div>
    </form>
  );
}
