import { Filter } from "lucide-react";
import { EnvNotice } from "@/components/EnvNotice";
import { ProductGrid } from "@/components/ProductGrid";
import { SearchBox } from "@/components/SearchBox";
import { searchProducts } from "@/lib/product-queries";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = firstParam(params.q);
  const lineType = firstParam(params.line_type);
  const productType = firstParam(params.product_type);
  const result = await searchProducts({ q, lineType, productType, limit: 48 });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-black text-ink">상품 검색</h1>
        <SearchBox defaultValue={q} compact />
        {!result.configured ? <EnvNotice /> : null}
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-white p-4">
        <input type="hidden" name="q" value={q} />
        <div className="flex items-center gap-2 text-sm font-bold text-ink">
          <Filter aria-hidden="true" className="h-4 w-4 text-mint" />
          필터
        </div>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-neutral-700">라인업</span>
          <input
            name="line_type"
            defaultValue={lineType}
            placeholder="예: scale, nendoroid"
            className="h-10 rounded-md border border-line px-3 outline-none focus:border-mint"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-neutral-700">상품 타입</span>
          <input
            name="product_type"
            defaultValue={productType}
            placeholder="예: figure"
            className="h-10 rounded-md border border-line px-3 outline-none focus:border-mint"
          />
        </label>
        <button
          type="submit"
          className="h-10 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-coral"
        >
          적용
        </button>
      </form>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-neutral-600">
          {q ? `"${q}" 검색 결과` : "전체 상품"} {result.items.length.toLocaleString("ko-KR")}개
        </p>
      </div>

      <ProductGrid products={result.items} emptyText="검색 결과가 없습니다." />
    </div>
  );
}
