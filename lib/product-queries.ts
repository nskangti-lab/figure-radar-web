import { getPublicSupabase } from "@/lib/supabase/server";
import type { AnyRecord, ProductCardItem } from "@/lib/types";
import { asString, optionLabel } from "@/lib/format";

type ProductSearchArgs = {
  q?: string;
  lineType?: string;
  productType?: string;
  limit?: number;
};

const productSearchFields = [
  "display_name_kr",
  "canonical_name_jp",
  "work_name_kr",
  "character_name_kr",
  "manufacturer_name_kr"
];

function cleanSearchTerm(value: string) {
  return value.replace(/[%(),]/g, " ").replace(/\s+/g, " ").trim();
}

function searchOr(term: string) {
  return productSearchFields
    .map((field) => `${field}.ilike.%${term}%`)
    .join(",");
}

function asRecord(value: unknown): AnyRecord | null {
  if (Array.isArray(value)) {
    return asRecord(value[0]);
  }

  if (value && typeof value === "object") {
    return value as AnyRecord;
  }

  return null;
}

function productGroupToCard(group: AnyRecord): ProductCardItem {
  return {
    ...group,
    product_group_id: asString(group.id),
    display_name_kr: asString(group.display_name_kr),
    canonical_name_jp: asString(group.canonical_name_jp),
    slug: asString(group.slug),
    line_type: asString(group.line_type),
    product_type: asString(group.product_type),
    image_url: asString(group.main_image_url || group.image_url),
    main_image_url: asString(group.main_image_url)
  };
}

function productGroupFromListing(listing: AnyRecord) {
  const variant = asRecord(listing.product_variants);
  return variant ? asRecord(variant.product_groups) : null;
}

function dedupeProducts(items: ProductCardItem[]) {
  const seen = new Set<string>();
  const result: ProductCardItem[] = [];

  for (const item of items) {
    const key =
      asString(item.product_group_id) || asString(item.id) || asString(item.slug);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

async function runProductQuery(args: ProductSearchArgs) {
  const supabase = getPublicSupabase();
  if (!supabase) {
    return { configured: false, items: [] as ProductCardItem[] };
  }

  const limit = args.limit ?? 24;
  const term = cleanSearchTerm(args.q ?? "");
  let query = supabase.from("product_search_view").select("*").limit(limit);

  if (term) {
    query = query.or(searchOr(term));
  }

  if (args.lineType) {
    query = query.eq("line_type", args.lineType);
  }

  if (args.productType) {
    query = query.eq("product_type", args.productType);
  }

  let response = await query.order("created_at", { ascending: false });

  if (response.error) {
    response = await query;
  }

  return {
    configured: true,
    items: ((response.data ?? []) as ProductCardItem[]).slice(0, limit),
    error: response.error?.message
  };
}

async function aliasProductGroupIds(term: string) {
  const supabase = getPublicSupabase();
  if (!supabase || !term) {
    return [];
  }

  const columns = ["alias_text", "alias", "name", "keyword"];

  for (const column of columns) {
    const { data, error } = await supabase
      .from("aliases")
      .select("*")
      .ilike(column, `%${term}%`)
      .limit(50);

    if (error) {
      continue;
    }

    return ((data ?? []) as AnyRecord[])
      .map((row) => {
        const explicit = asString(row.product_group_id);
        if (explicit) {
          return explicit;
        }

        const targetType = asString(row.target_type || row.entity_type).toLowerCase();
        const targetId = asString(row.target_id || row.entity_id);
        if (targetId && targetType.includes("product")) {
          return targetId;
        }

        return "";
      })
      .filter(Boolean);
  }

  return [];
}

async function productsByGroupIds(groupIds: string[], limit: number) {
  const supabase = getPublicSupabase();
  if (!supabase || groupIds.length === 0) {
    return [];
  }

  const byProductGroup = await supabase
    .from("product_search_view")
    .select("*")
    .in("product_group_id", groupIds)
    .limit(limit);

  if (!byProductGroup.error) {
    return (byProductGroup.data ?? []) as ProductCardItem[];
  }

  const byId = await supabase
    .from("product_search_view")
    .select("*")
    .in("id", groupIds)
    .limit(limit);

  return ((byId.data ?? []) as ProductCardItem[]) || [];
}

export async function searchProducts(args: ProductSearchArgs) {
  const primary = await runProductQuery(args);

  if (!primary.configured || !args.q) {
    return primary;
  }

  const term = cleanSearchTerm(args.q);
  const groupIds = await aliasProductGroupIds(term);
  const aliasMatches = await productsByGroupIds(groupIds, args.limit ?? 24);

  return {
    ...primary,
    items: dedupeProducts([...primary.items, ...aliasMatches])
  };
}

export async function latestProducts(limit = 8) {
  const supabase = getPublicSupabase();
  if (!supabase) {
    return { configured: false, items: [] as ProductCardItem[] };
  }

  let response = await supabase
    .from("product_groups")
    .select("*")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (response.error) {
    response = await supabase
      .from("product_groups")
      .select("*")
      .eq("status", "ACTIVE")
      .limit(limit);
  }

  return {
    configured: true,
    items: ((response.data ?? []) as AnyRecord[]).map(productGroupToCard),
    error: response.error?.message
  };
}

export async function preorderProducts(limit = 8) {
  const supabase = getPublicSupabase();
  if (!supabase) {
    return { configured: false, items: [] as ProductCardItem[] };
  }

  const preorderStatuses = ["PREORDER_OPEN", "PREORDER_CLOSED", "COMING_SOON"];
  const response = await supabase
    .from("shop_listings")
    .select("stock_status, product_variants(product_groups(*))")
    .in("stock_status", preorderStatuses)
    .limit(limit * 4);

  const groups = ((response.data ?? []) as AnyRecord[])
    .map(productGroupFromListing)
    .filter((group): group is AnyRecord => Boolean(group))
    .map(productGroupToCard);

  return {
    configured: true,
    items: dedupeProducts(groups).slice(0, limit),
    error: response.error?.message
  };
}

export async function popularWorks(limit = 8) {
  const supabase = getPublicSupabase();
  const labelFor = (row: AnyRecord) =>
    optionLabel(row, ["name_kr", "title_kr", "name_jp", "title_jp", "name", "title"]);

  if (!supabase) {
    return { configured: false, items: [] as AnyRecord[], labelFor };
  }

  const groupsResponse = await supabase
    .from("product_groups")
    .select("work_id")
    .not("work_id", "is", null)
    .limit(1000);

  if (groupsResponse.error || !groupsResponse.data?.length) {
    return {
      configured: true,
      items: [] as AnyRecord[],
      labelFor
    };
  }

  const rankedWorkIds = Object.entries(
    ((groupsResponse.data ?? []) as AnyRecord[]).reduce<Record<string, number>>((acc, group) => {
      const workId = asString(group.work_id);
      if (workId) {
        acc[workId] = (acc[workId] ?? 0) + 1;
      }
      return acc;
    }, {})
  )
    .sort(([, left], [, right]) => right - left)
    .slice(0, limit)
    .map(([workId]) => workId);

  const response = await supabase.from("works").select("*").in("id", rankedWorkIds);
  const byId = new Map(
    ((response.data ?? []) as AnyRecord[]).map((work) => [asString(work.id), work])
  );

  return {
    configured: true,
    items: rankedWorkIds
      .map((workId) => byId.get(workId))
      .filter((work): work is AnyRecord => Boolean(work)),
    labelFor
  };
}
