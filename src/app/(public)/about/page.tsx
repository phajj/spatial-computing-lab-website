// src/app/(public)/about/page.tsx
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About | Merrimack College Spatial Computing Lab",
  description:
    "Learn about the Merrimack College Spatial Computing Lab and how to get in touch.",
};

const people: { name: string; role: string; photo?: string }[] = [
  { name: "Brandy Benedict, Ph.D.", role: "Associate Professor" },
  {
    name: "Peter Hajj",
    role: "Undergraduate Lab Manager",
    photo: "/team/PeterHajj.jpg",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-white dark:bg-gray-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-20 sm:px-6 sm:py-28">
          <span className="w-fit rounded-full bg-mc-gold px-3 py-1 text-xs font-bold uppercase tracking-wider text-mc-blue">
            About the Lab
          </span>
          <h1 className="font-extrabold text-4xl leading-tight text-mc-blue dark:text-white sm:text-5xl">
            Spatial Computing Lab
          </h1>
          <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Department of Computer and Data Sciences, Merrimack College
          </p>
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-16 max-w-2xl">
            <h2 className="font-extrabold text-3xl text-mc-blue dark:text-white">
              Contact Us
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              Email us at{" "}
              <a
                href="mailto:spatialcomputing@merrimack.edu"
                className="font-semibold text-mc-blue underline transition hover:text-mc-blue/70 dark:text-white dark:hover:text-mc-gold"
              >
                spatialcomputing@merrimack.edu
              </a>{" "}
              to learn more about the lab, schedule a tour or demo, or to chat
              about potential collaborations.
            </p>
          </div>

          <h2 className="mb-8 font-extrabold text-3xl text-mc-blue dark:text-white">
            Affiliated Faculty and Students
          </h2>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((person) => (
              <div
                key={person.name}
                className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-950"
              >
                {person.photo ? (
                  <Image
                    src={person.photo}
                    alt={person.name}
                    width={128}
                    height={128}
                    className="h-32 w-32 rounded-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border border-dashed border-gray-300 bg-gray-100 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                    Photo goes here
                  </div>
                )}
                <p className="font-extrabold text-lg text-mc-blue dark:text-white">
                  {person.name}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {person.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
