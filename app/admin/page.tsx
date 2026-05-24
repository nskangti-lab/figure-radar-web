import Link from "next/link";
import { ArrowRight, Database } from "lucide-react";
import { EnvNotice } from "@/components/EnvNotice";
import { adminNav } from "@/lib/admin/config";
import { getAdminRows } from "@/lib/admin/data";
import { asDisplay, asString } from "@/lib/format";

export default async function AdminDashboardPage() {
  const recentProducts = await getAdminRows("product_groups", 6);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-coral">Figure Radar Admin</p>
        <h1 className="text-2xl font-black text-ink">관리자 대시보드</h1>
      </div>

      {!recentProducts.configured ? <EnvNotice kind="service" /> : null}

      <section>
        <h2 className="mb-3 font-bold text-ink">주요 테이블</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-lg border border-line bg-white p-4 transition hover:border-mint hover:shadow-soft"
            >
              <span className="inline-flex items-center gap-3 font-bold text-ink">
                <Database aria-hidden="true" className="h-4 w-4 text-mint" />
                {item.label}
              </span>
              <ArrowRight aria-hidden="true" className="h-4 w-4 text-neutral-400" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-bold text-ink">최근 등록 상품</h2>
        {recentProducts.rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-neutral-500">
            최근 등록 상품이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
            {recentProducts.rows.map((row, index) => (
              <div
                key={asString(row.id) || index}
                className="grid gap-2 p-4 md:grid-cols-[1fr_auto] md:items-center"
              >
                <div>
                  <p className="font-bold text-ink">
                    {asDisplay(row.display_name_kr || row.canonical_name_jp || row.id)}
                  </p>
                  <p className="text-sm text-neutral-500">{asDisplay(row.slug)}</p>
                </div>
                {row.slug ? (
                  <Link
                    href={`/products/${row.slug}`}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-line px-3 text-sm font-semibold text-ink hover:border-mint"
                  >
                    상세 보기
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
