import Link from "next/link";
import { CalendarDays, Factory, Store } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import {
  asDisplay,
  asString,
  formatMonth,
  formatPrice,
  formatStockStatus,
  productImage,
  productTitle
} from "@/lib/format";
import type { ProductCardItem } from "@/lib/types";

type ProductCardProps = {
  product: ProductCardItem;
};

export function ProductCard({ product }: ProductCardProps) {
  const title = productTitle(product);
  const image = productImage(product);
  const slug = asString(product.slug).trim();
  const href = slug ? `/products/${slug}` : "/search";
  const releaseMonth = asString(product.release_month_jp).trim();
  const listing = product.representative_listing;
  const listingCount =
    typeof product.listing_count === "number" && Number.isFinite(product.listing_count)
      ? product.listing_count
      : 0;

  return (
    <Link
      href={href}
      className="group flex min-h-[320px] flex-col overflow-hidden rounded-lg border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="flex aspect-[4/3] items-center justify-center bg-neutral-100">
        <SafeImage
          src={image}
          alt={title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          fallbackClassName="flex h-20 w-20 items-center justify-center rounded-lg bg-paper text-2xl font-bold text-mint"
          fallbackText={title.slice(0, 1)}
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="line-clamp-2 text-base font-bold leading-snug text-ink">{title}</p>
          <p className="mt-1 line-clamp-1 text-sm text-neutral-500">
            {asDisplay(product.canonical_name_jp, asDisplay(product.work_name_kr, ""))}
          </p>
        </div>
        <div className="mt-auto grid gap-2 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-2">
            <Factory aria-hidden="true" className="h-4 w-4 text-mint" />
            {asDisplay(product.manufacturer_name_kr)}
          </span>
          {releaseMonth ? (
            <span className="inline-flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="h-4 w-4 text-coral" />
              {formatMonth(releaseMonth)}
            </span>
          ) : null}
          {listing ? (
            <span className="grid grid-cols-[auto_1fr] gap-2">
              <Store aria-hidden="true" className="mt-0.5 h-4 w-4 text-mint" />
              <span className="min-w-0 leading-tight">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-semibold text-ink">
                    {asDisplay(listing.shop_name)}
                  </span>
                  {listingCount > 0 ? (
                    <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                      판매처 {listingCount}곳
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-xs text-neutral-500">
                  {formatPrice(listing.price, asString(listing.currency || "JPY"))} ·{" "}
                  {formatStockStatus(listing.stock_status)}
                </span>
              </span>
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {product.line_type ? (
            <span className="rounded-md bg-paper px-2 py-1 text-neutral-700">
              {asDisplay(product.line_type)}
            </span>
          ) : null}
          {product.product_type ? (
            <span className="rounded-md bg-paper px-2 py-1 text-neutral-700">
              {asDisplay(product.product_type)}
            </span>
          ) : null}
          {product.official_price_jpy ? (
            <span className="rounded-md bg-paper px-2 py-1 text-neutral-700">
              {formatPrice(product.official_price_jpy, "JPY")}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
