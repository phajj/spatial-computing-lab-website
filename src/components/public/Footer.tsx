// src/components/public/Footer.tsx

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#00356A] text-white/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-serif text-base text-white">
            Merrimack College Spatial Computing Lab
          </p>
          <p className="mt-1 text-sm">
            510 Turnpike Street, North Andover, MA 01845
          </p>
        </div>

        <div className="flex flex-col gap-1 text-sm sm:items-end">
          <a
            href="mailto:spatialcomputing@merrimack.edu"
            className="transition hover:text-[#FFE000]"
          >
            spatialcomputing@merrimack.edu
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs sm:px-6">
        © {year} Merrimack College Spatial Computing Lab. All rights reserved.
      </div>
    </footer>
  );
}
