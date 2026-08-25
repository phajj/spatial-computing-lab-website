// src/app/admin/(protected)/(guarded)/layout.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

// Wraps every protected admin page except /admin/change-password (which
// lives in the parent (protected) group, outside this nested group, so it
// can't redirect-loop against itself). Route groups don't add a path
// segment, so this doesn't move any URLs — it just forces a stop at
// change-password first when a force-reset is pending.
export default async function GuardedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  if (session?.user.mustChangePassword) {
    redirect("/admin/change-password");
  }

  return children;
}
