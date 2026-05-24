import Link from "next/link";
import { adminNav } from "@/lib/admin/config";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-lg border border-line bg-white p-3 lg:sticky lg:top-20">
        <Link href="/admin" className="mb-3 block rounded-md px-3 py-2 font-black text-ink">
          관리자
        </Link>
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
      </aside>
      <div>{children}</div>
    </div>
  );
}
