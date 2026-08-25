// src/app/admin/(protected)/page.tsx
import { prisma } from "@/lib/db";

// Formats a Date as "MM-DD-YYYY" — matches the date format used by the
// admin CLI scripts (ls-admin, admin-log) for consistency.
function formatDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${date.getFullYear()}`;
}

// This dashboard is a read-only overview, not the media manager — capping
// the table (rather than paginating) keeps it simple until the manager
// (with its own paginated list) lands.
const DASHBOARD_ROW_LIMIT = 200;

export default async function AdminDashboardPage() {
  const [total, published, media] = await Promise.all([
    prisma.media.count(),
    prisma.media.count({ where: { published: true } }),
    prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: DASHBOARD_ROW_LIMIT,
      select: {
        id: true,
        title: true,
        type: true,
        category: true,
        collection: true,
        published: true,
        createdAt: true,
      },
    }),
  ]);
  const drafts = total - published;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl text-[#00356A] dark:text-white">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Overview of published and draft 360° media.
        {total > DASHBOARD_ROW_LIMIT &&
          ` Showing the ${DASHBOARD_ROW_LIMIT} most recently added, out of ${total} total.`}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total media" value={total} />
        <StatCard label="Published" value={published} />
        <StatCard label="Drafts" value={drafts} />
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-gray-900">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-black/10 text-gray-600 dark:border-white/10 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Collection</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {media.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No media yet.
                </td>
              </tr>
            ) : (
              media.map((item) => (
                <tr key={item.id} className="text-gray-800 dark:text-gray-200">
                  <td className="px-4 py-3">{item.title}</td>
                  <td className="px-4 py-3 capitalize">{item.type}</td>
                  <td className="px-4 py-3">{item.category ?? "—"}</td>
                  <td className="px-4 py-3">{item.collection ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        item.published
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300"
                          : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }
                    >
                      {item.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-gray-900">
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p className="mt-1 font-serif text-3xl text-[#00356A] dark:text-white">
        {value}
      </p>
    </div>
  );
}
