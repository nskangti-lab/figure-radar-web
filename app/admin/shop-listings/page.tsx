import { AdminEntityPage } from "@/components/admin/AdminEntityPage";
import { getAdminOptions } from "@/lib/admin/data";

export default async function AdminShopListingsPage() {
  const [variants, shops] = await Promise.all([
    getAdminOptions("product_variants", [
      "variant_label_kr",
      "jan_code",
      "edition_type",
      "release_month_jp"
    ]),
    getAdminOptions("shops", ["name", "slug", "shop_type", "base_url"])
  ]);

  return (
    <AdminEntityPage
      entityKey="shop_listings"
      optionsByField={{
        variant_id: variants,
        shop_id: shops
      }}
    />
  );
}
