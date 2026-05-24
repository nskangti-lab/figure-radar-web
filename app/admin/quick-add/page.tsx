import { QuickAddForm } from "@/components/admin/QuickAddForm";
import { getAdminOptions } from "@/lib/admin/data";

export default async function AdminQuickAddPage() {
  const shops = await getAdminOptions("shops", ["name", "slug", "shop_type", "base_url"]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-coral">Admin</p>
        <h1 className="text-2xl font-black text-ink">Quick Add</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Add one figure product with work, character, manufacturer, product group, variant,
          and shop listing in a single flow.
        </p>
      </div>
      <QuickAddForm shops={shops} />
    </div>
  );
}
