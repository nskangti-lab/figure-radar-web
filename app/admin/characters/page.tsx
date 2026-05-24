import { AdminEntityPage } from "@/components/admin/AdminEntityPage";
import { getAdminOptions } from "@/lib/admin/data";

export default async function AdminCharactersPage() {
  const works = await getAdminOptions("works", [
    "name_kr",
    "title_kr",
    "name_jp",
    "title_jp",
    "slug"
  ]);

  return <AdminEntityPage entityKey="characters" optionsByField={{ work_id: works }} />;
}
