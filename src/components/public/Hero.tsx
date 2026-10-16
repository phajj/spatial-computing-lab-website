// src/components/public/Hero.tsx
import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-white dark:bg-gray-950">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-6 sm:py-28">
        <span className="rounded-full bg-mc-gold px-3 py-1 text-xs font-bold uppercase tracking-wider text-mc-blue">
          Merrimack College
        </span>

        <h1 className="font-extrabold text-4xl leading-tight text-mc-blue dark:text-white sm:text-5xl md:text-6xl">
          Global Merrimack in Virtual Reality
        </h1>

        <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
          Experience 360 degrees of some of Merrimack&rsquo;s global education
          sites for short-term, faculty-led courses in Morocco, Canada, Costa
          Rica, and Greece. Images captured with an Insta360 X4 camera.
        </p>

        <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
          View the 360-degree images in a 2D browser window or immerse yourself
          in the 3D environment using a VR-enabled headset.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          <Link
            href="/gallery"
            className="rounded-md bg-mc-gold px-6 py-3 text-sm font-bold text-mc-blue transition hover:bg-mc-blue hover:text-white dark:hover:bg-white"
          >
            Explore the Gallery
          </Link>
          <Link
            href="/viewer"
            className="rounded-md border border-mc-blue px-6 py-3 text-sm font-bold text-mc-blue transition hover:bg-mc-blue/5 dark:border-white/40 dark:text-white dark:hover:bg-white/10"
          >
            Launch the 360° Viewer
          </Link>
        </div>
      </div>
    </section>
  );
}
