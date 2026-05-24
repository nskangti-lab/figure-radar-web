import { notFound } from "next/navigation";
import { EnvNotice } from "@/components/EnvNotice";
import { PurchaseButton } from "@/components/PurchaseButton";
import { asDisplay, asString, formatMonth, formatPrice, relationName } from "@/lib/format";
import { getProductDetail } from "@/lib/product-detail";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

const nameFields = ["name_kr", "title_kr", "display_name_kr", "name_jp", "title_jp", "name"];

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const detail = await getProductDetail(slug);

  if (!detail.configured) {
    return <EnvNotice />;
  }

  if (!detail.group) {
    notFound();
  }

  const group = detail.group;
  const title = asDisplay(group.display_name_kr, asDisplay(group.canonical_name_jp, "상품"));
  const workName = relationName(group.works, nameFields);
  const characterName = relationName(group.characters, nameFields);
  const manufacturerName = relationName(group.manufacturers, nameFields);

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <p className="mb-2 text-sm font-bold text-coral">Product Group</p>
        <h1 className="text-3xl font-black leading-tight text-ink">{title}</h1>
        {group.canonical_name_jp ? (
          <p className="mt-2 text-neutral-600">{asDisplay(group.canonical_name_jp)}</p>
        ) : null}

        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoTerm label="작품" value={workName || group.work_name_kr} />
          <InfoTerm label="캐릭터" value={characterName || group.character_name_kr} />
          <InfoTerm label="제조사" value={manufacturerName || group.manufacturer_name_kr} />
          <InfoTerm label="라인업" value={group.line_type} />
          <InfoTerm label="스케일" value={group.scale} />
          <InfoTerm
            label="버전"
            value={group.version_name_kr || group.version_name_jp || group.version_name_en}
          />
        </dl>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">상품 Variant 및 판매처</h2>
        {detail.variants.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-neutral-500">
            연결된 variant가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {detail.variants.map((variant) => {
              const variantId = asString(variant.id);
              const listings = detail.listingsByVariant[variantId] ?? [];

              return (
                <article
                  key={variantId}
                  className="rounded-lg border border-line bg-white p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div>
                      <h3 className="font-bold text-ink">
                        {asDisplay(variant.edition_type, "기본판")}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-600">
                        JAN {asDisplay(variant.jan_code)} · 출시 {formatMonth(variant.release_month_jp)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-mint">
                      공식가 {formatPrice(variant.official_price_jpy, "JPY")}
                    </p>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-lg border border-line">
                    {listings.length === 0 ? (
                      <div className="bg-paper px-4 py-6 text-center text-sm text-neutral-500">
                        연결된 판매처가 없습니다.
                      </div>
                    ) : (
                      <div className="divide-y divide-line">
                        {listings.map((listing) => {
                          const shopName =
                            relationName(listing.shops, ["name_kr", "name", "raw_shop_name"]) ||
                            asDisplay(listing.raw_shop_name, "판매처");
                          const href = asString(listing.affiliate_url || listing.listing_url);

                          return (
                            <div
                              key={asString(listing.id)}
                              className="grid gap-3 bg-white p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center"
                            >
                              <div>
                                <p className="font-bold text-ink">{shopName}</p>
                                <p className="text-sm text-neutral-500">
                                  재고 {asDisplay(listing.stock_status)}
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-ink">
                                {formatPrice(listing.price, asString(listing.currency, "JPY"))}
                              </p>
                              {href ? (
                                <PurchaseButton
                                  href={href}
                                  listingId={asString(listing.id)}
                                  variantId={variantId}
                                  productGroupId={asString(group.id)}
                                />
                              ) : (
                                <span className="text-sm text-neutral-500">링크 없음</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoTerm({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg bg-paper p-4">
      <dt className="text-xs font-bold text-neutral-500">{label}</dt>
      <dd className="mt-1 font-semibold text-ink">{asDisplay(value)}</dd>
    </div>
  );
}
