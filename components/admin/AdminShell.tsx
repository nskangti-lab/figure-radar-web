"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAdmin } from "@/lib/admin/auth-actions";
import { adminNav } from "@/lib/admin/config";

type AdminShellProps = {
  children: React.ReactNode;
  passwordConfigured: boolean;
};

export function AdminShell({ children, passwordConfigured }: AdminShellProps) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <div>{children}</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-lg border border-line bg-white p-3 lg:sticky lg:top-20">
        <Link href="/admin" className="mb-3 block rounded-md px-3 py-2 font-black text-ink">
          관리자
        </Link>
        {!passwordConfigured ? (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            ADMIN_PASSWORD is not configured.
          </div>
        ) : null}
        <nav className="grid gap-1 text-sm font-semibold text-neutral-700">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 hover:bg-paper hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAdmin} className="mt-4">
          <button
            type="submit"
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:border-coral hover:text-coral"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Log out
          </button>
        </form>
      </aside>
      <div>{children}</div>
    </div>
  );
}
