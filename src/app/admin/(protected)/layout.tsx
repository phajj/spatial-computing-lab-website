// src/app/admin/(protected)/layout.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

// Wraps every admin page except /admin/login (which lives outside this
// route group, so it isn't wrapped by this layout and can't redirect-loop
// against itself). Any admin page under here requires a signed-in session.
export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <AdminNav adminEmail={session.user.email} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
