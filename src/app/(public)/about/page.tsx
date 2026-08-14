// src/app/(public)/about/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Merrimack College Spatial Computing Lab",
  description:
    "Learn about the Merrimack College Spatial Computing Lab's mission and how to get in touch.",
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-white dark:bg-gray-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-20 sm:px-6 sm:py-28">
          <span className="w-fit rounded-full bg-[#FFE000] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#00356A]">
            About the Lab
          </span>
          <h1 className="font-serif text-4xl leading-tight text-[#00356A] dark:text-white sm:text-5xl">
            Placeholder mission statement for the Spatial Computing Lab
          </h1>
          <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
            *Placeholder text* Description of the Spatial Computing Lab's mission.
          </p>
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="font-serif text-3xl text-[#00356A] dark:text-white">
              Contact Us
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              *Placeholder text* a short message about contacting us for info, demos/tours, collaborating on projects etc

            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                General Lab Email
              </p>
              <a
                href="mailto:spatialcomputing@merrimack.edu"
                className="font-serif text-lg text-[#00356A] transition hover:text-[#00356A]/70 dark:text-white dark:hover:text-[#FFE000]"
              >
                spatialcomputing@merrimack.edu
              </a>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                *Placeholder text* a short message about contacting us for info, demos/tours, collaborating on projects etc
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
              <div className="flex h-32 w-32 items-center justify-center self-center rounded-full border border-dashed border-gray-300 bg-gray-100 text-center text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                Photo goes here
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Undergraduate Lab Manager
              </p>
              <p className="font-serif text-lg text-[#00356A] dark:text-white">
                Peter Hajj
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                *Placeholder text* a short bio for Peter will go here.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
              <div className="flex h-32 w-32 items-center justify-center self-center rounded-full border border-dashed border-gray-300 bg-gray-100 text-center text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                Photo goes here
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Faculty Member
              </p>
              <p className="font-serif text-lg text-[#00356A] dark:text-white">
                Brandy Benedict, Ph.D.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                *Placeholder text* a short bio for Dr. Benedict will go here.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
