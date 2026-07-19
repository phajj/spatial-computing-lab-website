// src/components/public/StatsBar.tsx

interface Stat {
  label: string;
  value: number;
}

// Deliberately always blue (not white/dark like the sections around it) —
// this band is the "blue in the middle of the page" anchor in both themes.
export default function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <section className="bg-[#00356A]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 text-center sm:grid-cols-3 sm:px-6">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="font-serif text-4xl text-white">{stat.value}</p>
            <p className="mt-1 text-sm font-medium uppercase tracking-wide text-white/70">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
