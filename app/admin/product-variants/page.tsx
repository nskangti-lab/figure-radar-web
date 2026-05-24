import { AdminEntityPage } from "@/components/admin/AdminEntityPage";
import { getAdminOptions } from "@/lib/admin/data";

export default async function AdminProductVariantsPage() {
  const productGroups = await getAdminOptions("product_groups", [
    "display_name_kr",
    "canonical_name_jp",
    "slug"
  ]);

  return (
    <AdminEntityPage
      entityKey="product_variants"
      optionsByField={{ product_group_id: productGroups }}
    />
  );
}
