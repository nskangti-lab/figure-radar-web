import { BulkAddForm } from "@/components/admin/BulkAddForm";
import { getServiceSupabase } from "@/lib/supabase/server";

async function getPreviewReferences() {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return { productSlugs: [], shopSlugs: [] };
  }

  const [products, shops] = await Promise.all([
    supabase.from("product_groups").select("slug"),
    supabase.from("shops").select("slug")
  ]);

  return {
    productSlugs: products.data?.map((product) => String(product.slug)).filter(Boolean) ?? [],
    shopSlugs: shops.data?.map((shop) => String(shop.slug)).filter(Boolean) ?? []
  };
}

export default async function AdminBulkAddPage() {
  const references = await getPreviewReferences();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-coral">Admin</p>
        <h1 className="text-2xl font-black text-ink">Bulk Add</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Paste CSV, preview generated figure product names, then create product groups, variants,
          and shop listings row by row.
        </p>
      </div>
      <BulkAddForm productSlugs={references.productSlugs} shopSlugs={references.shopSlugs} />
    </div>
  );
}
