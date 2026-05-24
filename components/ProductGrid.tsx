import { ProductCard } from "@/components/ProductCard";
import type { ProductCardItem } from "@/lib/types";

type ProductGridProps = {
  products: ProductCardItem[];
  emptyText?: string;
};

export function ProductGrid({
  products,
  emptyText = "표시할 상품이 없습니다."
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-neutral-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard
          key={`${product.product_group_id ?? product.id ?? product.slug ?? index}`}
          product={product}
        />
      ))}
    </div>
  );
}
