import { AdminEntityPage } from "@/components/admin/AdminEntityPage";
import { getAliasTargetOptions } from "@/lib/admin/data";

export default async function AdminAliasesPage() {
  const targetOptions = await getAliasTargetOptions();

  return (
    <AdminEntityPage
      entityKey="aliases"
      optionsByField={{
        target_id: targetOptions
      }}
    />
  );
}
