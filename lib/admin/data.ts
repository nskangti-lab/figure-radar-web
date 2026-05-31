import { optionLabel } from "@/lib/format";
import { getAdminEntity } from "@/lib/admin/config";
import { getServiceSupabase } from "@/lib/supabase/server";
import type { AdminEntityKey } from "@/lib/admin/config";
import type { AdminOption, AnyRecord } from "@/lib/types";

export async function getAdminRows(entityKey: AdminEntityKey, limit = 50) {
  const supabase = getServiceSupabase();
  const config = getAdminEntity(entityKey);

  if (!supabase || !config) {
    return {
      configured: Boolean(supabase),
      rows: [] as AnyRecord[],
      error: null as string | null
    };
  }

  const selectColumns = entityKey === "shop_listings" ? "*, shops(name, slug)" : "*";

  let response = await supabase
    .from(config.table)
    .select(selectColumns)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (response.error) {
    response = await supabase.from(config.table).select("*").limit(limit);
  }

  return {
    configured: true,
    rows: ((response.data ?? []) as unknown) as AnyRecord[],
    error: response.error?.message ?? null
  };
}

export async function getAdminOptions(
  table: string,
  labelFields: string[],
  limit = 200
): Promise<AdminOption[]> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return [];
  }

  let response = await supabase
    .from(table)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (response.error) {
    response = await supabase.from(table).select("*").limit(limit);
  }

  return ((response.data ?? []) as AnyRecord[])
    .map((row) => ({
      id: String(row.id ?? ""),
      label: optionLabel(row, labelFields)
    }))
    .filter((option) => option.id);
}

export async function getAliasTargetOptions(): Promise<AdminOption[]> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return [];
  }

  const configs = [
    { table: "works", group: "WORK", fields: ["name_kr", "name_jp", "name_en", "slug"] },
    { table: "characters", group: "CHARACTER", fields: ["name_kr", "name_jp", "name_en", "slug"] },
    {
      table: "manufacturers",
      group: "MANUFACTURER",
      fields: ["name_kr", "name_jp", "name_en", "slug"]
    },
    {
      table: "product_groups",
      group: "PRODUCT_GROUP",
      fields: ["display_name_kr", "canonical_name_jp", "slug"]
    }
  ];

  const groups = await Promise.all(
    configs.map(async (config) => {
      let response = await supabase
        .from(config.table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (response.error) {
        response = await supabase.from(config.table).select("*").limit(200);
      }

      if (response.error) {
        return [] as AdminOption[];
      }

      return ((response.data ?? []) as AnyRecord[])
        .map((row) => ({
          id: String(row.id ?? ""),
          label: `${config.group}: ${optionLabel(row, config.fields)}`,
          group: config.group
        }))
        .filter((option) => option.id);
    })
  );

  return groups.flat();
}
