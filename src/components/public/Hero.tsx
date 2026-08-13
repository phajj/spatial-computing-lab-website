// src/components/public/Hero.tsx
import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-white dark:bg-gray-950">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-6 sm:py-28">
        <span className="rounded-full bg-[#FFE000] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#00356A]">
          Merrimack College
        </span>

        <h1 className="font-serif text-4xl leading-tight text-[#00356A] dark:text-white sm:text-5xl md:text-6xl">
            *Something cool about Merrimack here*
        </h1>

        <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
          place holder text
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          <Link
            href="/gallery"
            className="rounded-md bg-[#FFE000] px-6 py-3 text-sm font-bold text-[#00356A] transition hover:bg-[#00356A] hover:text-white dark:hover:bg-white"
          >
            Explore the Gallery
          </Link>
          <Link
            href="/viewer"
            className="rounded-md border border-[#00356A] px-6 py-3 text-sm font-bold text-[#00356A] transition hover:bg-[#00356A]/5 dark:border-white/40 dark:text-white dark:hover:bg-white/10"
          >
            Launch the 360° Viewer
          </Link>
        </div>
      </div>
    </section>
  );
}
