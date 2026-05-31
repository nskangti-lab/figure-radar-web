import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { adminPassword, isProduction, safeAdminNext } from "@/lib/admin/auth";

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const configured = Boolean(adminPassword());

  return (
    <div className="mx-auto max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
      <p className="text-sm font-bold text-coral">Figure Radar Admin</p>
      <h1 className="mt-2 text-2xl font-black text-ink">Admin login</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Enter the admin password to continue.
      </p>

      {!configured ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {isProduction()
            ? "ADMIN_PASSWORD is not configured. Admin access is blocked."
            : "ADMIN_PASSWORD is not configured. Add it to .env.local for local admin login."}
        </div>
      ) : null}

      <div className="mt-5">
        <AdminLoginForm nextPath={safeAdminNext(params.next)} />
      </div>
    </div>
  );
}
