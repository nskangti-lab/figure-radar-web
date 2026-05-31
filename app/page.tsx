import Link from "next/link";
import { EnvNotice } from "@/components/EnvNotice";
import { ProductGrid } from "@/components/ProductGrid";
import { SearchBox } from "@/components/SearchBox";
import { SectionHeader } from "@/components/SectionHeader";
import { latestProducts, popularWorks, preorderProducts } from "@/lib/product-queries";
import { asString } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [latest, preorders, works] = await Promise.all([
    latestProducts(8),
    preorderProducts(8),
    popularWorks(8)
  ]);

  const configured = latest.configured && preorders.configured && works.configured;

  return (
    <div className="space-y-10">
      <section className="grid gap-6 py-4 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-bold text-coral">Figure Radar</p>
            <h1 className="max-w-2xl text-3xl font-black leading-tight text-ink sm:text-5xl">
              피규어 상품을 빠르게 찾고 판매처로 이동하세요.
            </h1>
          </div>
          <SearchBox />
          {!configured ? <EnvNotice /> : null}
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-paper p-4">
              <p className="text-neutral-500">관리 구조</p>
              <p className="mt-2 font-bold text-ink">작품 / 캐릭터 / 제조사</p>
            </div>
            <div className="rounded-lg bg-paper p-4">
              <p className="text-neutral-500">상품 구조</p>
              <p className="mt-2 font-bold text-ink">Group / Variant / Listing</p>
            </div>
            <div className="rounded-lg bg-paper p-4">
              <p className="text-neutral-500">판매 방식</p>
              <p className="mt-2 font-bold text-ink">외부 판매처 연결</p>
            </div>
            <div className="rounded-lg bg-paper p-4">
              <p className="text-neutral-500">검색 기준</p>
              <p className="mt-2 font-bold text-ink">상품명 / 별칭 / 작품</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="최신 등록 상품" description="최근 등록된 피규어 상품입니다." />
        <ProductGrid products={latest.items} />
      </section>

      <section>
        <SectionHeader title="예약중 상품" description="예약 또는 선주문 상태의 상품입니다." />
        <ProductGrid products={preorders.items} />
      </section>

      <section>
        <SectionHeader title="인기 작품" description="등록된 작품을 빠르게 둘러보세요." />
        {works.items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-neutral-500">
            표시할 작품이 없습니다.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {works.items.map((work, index) => {
              const label = works.labelFor(work);
              return (
                <Link
                  href={`/search?q=${encodeURIComponent(label)}`}
                  key={`${asString(work.id) || index}`}
                  className="rounded-lg border border-line bg-white p-4 transition hover:border-mint hover:shadow-soft"
                >
                  <p className="line-clamp-2 font-bold text-ink">{label}</p>
                  <p className="mt-2 text-sm text-neutral-500">관련 상품 보기</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
