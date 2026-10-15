// src/app/admin/(protected)/change-password/page.tsx
import { requireAdmin } from "@/lib/auth";
import ChangePasswordForm from "@/components/admin/ChangePasswordForm";

export default async function ChangePasswordPage() {
  await requireAdmin({ allowPendingReset: true });

  return <ChangePasswordForm />;
}
