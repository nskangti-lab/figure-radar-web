import { AdminEntityPage } from "@/components/admin/AdminEntityPage";
import { getAdminOptions } from "@/lib/admin/data";

export default async function AdminProductGroupsPage() {
  const [works, characters, manufacturers] = await Promise.all([
    getAdminOptions("works", ["name_kr", "title_kr", "name_jp", "title_jp", "slug"]),
    getAdminOptions("characters", ["name_kr", "name_jp", "slug"]),
    getAdminOptions("manufacturers", ["name_kr", "name_jp", "slug"])
  ]);

  return (
    <AdminEntityPage
      entityKey="product_groups"
      optionsByField={{
        work_id: works,
        character_id: characters,
        manufacturer_id: manufacturers
      }}
    />
  );
}
