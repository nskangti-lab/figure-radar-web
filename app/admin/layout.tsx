import { AdminShell } from "@/components/admin/AdminShell";
import { adminPassword } from "@/lib/admin/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell passwordConfigured={Boolean(adminPassword())}>
      {children}
    </AdminShell>
  );
}
