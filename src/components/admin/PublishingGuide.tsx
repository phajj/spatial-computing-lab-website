// src/components/admin/PublishingGuide.tsx

const STEPS = [
  {
    title: "Upload",
    body: "Drop a 360° photo or video into the upload box and fill in its details. Every upload starts as a draft, which only signed-in admins can see.",
  },
  {
    title: "Review",
    body: "Click the item's title in the list to open its edit page. Check the title, category, album, location, and date. Category and album control where it shows up in the Gallery filters.",
  },
  {
    title: "Publish",
    body: "Click Publish in the list, or Save & publish on the edit page. The item appears on the public Home, Gallery, and 360° Viewer pages right away.",
  },
  {
    title: "Check it live",
    body: "On a published item's edit page, use View on public site to open it in the 360° Viewer.",
  },
  {
    title: "Unpublish if needed",
    body: "Unpublish takes an item off the public site and returns it to draft. The file and its details are kept, so you can publish it again at any time.",
  },
];

export default function PublishingGuide({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-gray-900"
    >
      <summary className="cursor-pointer list-none text-sm font-medium text-[#00356A] dark:text-white">
        <span className="mr-2 inline-block transition group-open:rotate-90">›</span>
        How publishing works
      </summary>
      <ol className="mt-4 space-y-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFE000] text-xs font-bold text-[#00356A]">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {step.title}
              </p>
              <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </details>
  );
}
