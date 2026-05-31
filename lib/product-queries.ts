import { getPublicSupabase, getServiceSupabase } from "@/lib/supabase/server";
import type { AnyRecord, ProductCardItem } from "@/lib/types";
import { asString, optionLabel, relationName } from "@/lib/format";

type ProductSearchArgs = {
  q?: string;
  lineType?: string;
  productType?: string;
  limit?: number;
};

const productSearchFields = [
  "display_name_kr",
  "canonical_name_jp",
  "display_name_en",
  "work_name_kr",
  "work_name_jp",
  "character_name_kr",
  "character_name_jp",
  "manufacturer_name_kr",
  "manufacturer_name_jp"
];

const fallbackProductSearchFields = [
  "display_name_kr",
  "canonical_name_jp",
  "work_name_kr",
  "character_name_kr",
  "manufacturer_name_kr"
];

function cleanSearchTerm(value: string) {
  return value.replace(/[%(),]/g, " ").replace(/\s+/g, " ").trim();
}

function searchOr(term: string, fields = productSearchFields) {
  return fields
    .map((field) => `${field}.ilike.%${term}%`)
    .join(",");
}

function isSearchColumnError(error: { message?: string } | null | undefined) {
  const message = asString(error?.message).toLowerCase();
  return message.includes("column") || message.includes("schema cache");
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

function getReadSupabase() {
  return getServiceSupabase() ?? getPublicSupabase();
}

function productGroupToCard(group: AnyRecord): ProductCardItem {
  return {
    ...group,
    product_group_id: asString(group.id),
    display_name_kr: asString(group.display_name_kr),
    canonical_name_jp: asString(group.canonical_name_jp),
    manufacturer_name_kr:
      asString(group.manufacturer_name_kr) || relationName(group.manufacturers, ["name_kr", "name"]),
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

function productGroupKey(item: ProductCardItem) {
  return asString(item.product_group_id) || asString(item.id);
}

function listingPriority(status: unknown) {
  const value = asString(status).toUpperCase();
  if (value === "IN_STOCK") {
    return 0;
  }
  if (value === "PREORDER_OPEN") {
    return 1;
  }
  if (value === "PREORDER_CLOSED") {
    return 2;
  }
  if (value === "COMING_SOON") {
    return 3;
  }

  return 4;
}

function priceValue(value: unknown) {
  const price = typeof value === "number" ? value : Number.parseFloat(asString(value));
  return Number.isFinite(price) ? price : Number.POSITIVE_INFINITY;
}

function representativeStatus(status: unknown) {
  const value = asString(status || "UNKNOWN").toUpperCase();
  return ["IN_STOCK", "PREORDER_OPEN", "PREORDER_CLOSED", "COMING_SOON", "UNKNOWN"].includes(value)
    ? value
    : "";
}

function imageUrlFromRecord(record: AnyRecord | null | undefined) {
  if (!record) {
    return "";
  }

  return asString(record.image_url || record.url || record.src || record.public_url).trim();
}

async function attachProductImages(items: ProductCardItem[]) {
  const supabase = getReadSupabase();
  const groupIds = Array.from(new Set(items.map(productGroupKey).filter(Boolean)));

  if (!supabase || groupIds.length === 0) {
    return items;
  }

  const imageByGroup = new Map<string, string>();
  for (const item of items) {
    const groupId = productGroupKey(item);
    const imageUrl = asString(item.main_image_url).trim();
    if (groupId && imageUrl) {
      imageByGroup.set(groupId, imageUrl);
    }
  }

  const imagesResponse = await supabase
    .from("images")
    .select("*")
    .eq("target_type", "PRODUCT_GROUP")
    .eq("is_primary", true)
    .in("target_id", groupIds)
    .limit(groupIds.length * 2);

  if (!imagesResponse.error) {
    for (const image of (imagesResponse.data ?? []) as AnyRecord[]) {
      const groupId = asString(image.target_id);
      const usageStatus = asString(image.usage_status).toUpperCase();
      const imageUrl = imageUrlFromRecord(image);

      if (
        groupId &&
        imageUrl &&
        !imageByGroup.has(groupId) &&
        usageStatus !== "HIDDEN" &&
        usageStatus !== "REMOVED"
      ) {
        imageByGroup.set(groupId, imageUrl);
      }
    }
  }

  const missingGroupIds = groupIds.filter((groupId) => !imageByGroup.has(groupId));
  if (missingGroupIds.length) {
    const variantsResponse = await supabase
      .from("product_variants")
      .select("id, product_group_id")
      .in("product_group_id", missingGroupIds);

    if (!variantsResponse.error && variantsResponse.data?.length) {
      const variantToGroup = new Map(
        ((variantsResponse.data ?? []) as AnyRecord[]).map((variant) => [
          asString(variant.id),
          asString(variant.product_group_id)
        ])
      );
      const variantIds = Array.from(variantToGroup.keys()).filter(Boolean);

      if (variantIds.length) {
        const listingsResponse = await supabase
          .from("shop_listings")
          .select("*")
          .eq("is_visible", true)
          .in("variant_id", variantIds)
          .limit(variantIds.length * 4);

        if (!listingsResponse.error) {
          for (const listing of (listingsResponse.data ?? []) as AnyRecord[]) {
            const groupId = variantToGroup.get(asString(listing.variant_id)) ?? "";
            const imageUrl = imageUrlFromRecord(listing);
            if (groupId && imageUrl && !imageByGroup.has(groupId)) {
              imageByGroup.set(groupId, imageUrl);
            }
          }
        }
      }
    }
  }

  return items.map((item) => {
    const imageUrl = imageByGroup.get(productGroupKey(item)) ?? "";
    if (!imageUrl) {
      return item;
    }

    return {
      ...item,
      image_url: imageUrl,
      representative_image_url: asString(item.representative_image_url) || imageUrl
    };
  });
}

async function enrichProductCards(items: ProductCardItem[]) {
  const supabase = getReadSupabase();
  const groupIds = Array.from(new Set(items.map(productGroupKey).filter(Boolean)));

  if (!supabase || groupIds.length === 0) {
    return items;
  }

  let response: { data: unknown[] | null; error: { message: string } | null } = await supabase
    .from("product_groups")
    .select("id, slug, display_name_kr, canonical_name_jp, line_type, product_type, main_image_url, manufacturers(name_kr, name)")
    .in("id", groupIds);

  if (response.error) {
    response = await supabase
      .from("product_groups")
      .select("id, slug, display_name_kr, canonical_name_jp, line_type, product_type, main_image_url")
      .in("id", groupIds);
  }

  if (response.error) {
    return items;
  }

  const groupsById = new Map(
    ((response.data ?? []) as AnyRecord[]).map((group) => [asString(group.id), group])
  );

  return items.map((item) => {
    const groupId = productGroupKey(item);
    const group = groupsById.get(groupId);
    if (!group) {
      return item;
    }

    return {
      ...item,
      product_group_id: groupId,
      slug: asString(item.slug) || asString(group.slug),
      display_name_kr: asString(item.display_name_kr) || asString(group.display_name_kr),
      canonical_name_jp: asString(item.canonical_name_jp) || asString(group.canonical_name_jp),
      manufacturer_name_kr:
        asString(item.manufacturer_name_kr) || relationName(group.manufacturers, ["name_kr", "name"]),
      line_type: asString(item.line_type) || asString(group.line_type),
      product_type: asString(item.product_type) || asString(group.product_type),
      main_image_url: asString(item.main_image_url) || asString(group.main_image_url),
      image_url: asString(item.image_url) || asString(group.main_image_url)
    };
  });
}

async function attachRepresentativeListings(items: ProductCardItem[]) {
  const supabase = getReadSupabase();
  const groupIds = Array.from(new Set(items.map(productGroupKey).filter(Boolean)));

  if (!supabase || groupIds.length === 0) {
    return items;
  }

  const variantsResponse = await supabase
    .from("product_variants")
    .select("id, product_group_id")
    .in("product_group_id", groupIds);

  if (variantsResponse.error || !variantsResponse.data?.length) {
    return items;
  }

  const variantToGroup = new Map(
    ((variantsResponse.data ?? []) as AnyRecord[]).map((variant) => [
      asString(variant.id),
      asString(variant.product_group_id)
    ])
  );
  const variantIds = Array.from(variantToGroup.keys()).filter(Boolean);

  if (variantIds.length === 0) {
    return items;
  }

  const listingsResponse = await supabase
    .from("shop_listings")
    .select("id, variant_id, price, currency, stock_status, is_visible, shops(name)")
    .eq("is_visible", true)
    .in("variant_id", variantIds)
    .limit(variantIds.length * 8);

  if (listingsResponse.error) {
    return items;
  }

  const bestByGroup = new Map<string, ProductCardItem["representative_listing"]>();
  const countByGroup = new Map<string, number>();

  for (const listing of (listingsResponse.data ?? []) as AnyRecord[]) {
    const shop = asRecord(listing.shops);
    const groupId = variantToGroup.get(asString(listing.variant_id)) ?? "";
    const stockStatus = representativeStatus(listing.stock_status);

    if (!groupId) {
      continue;
    }

    countByGroup.set(groupId, (countByGroup.get(groupId) ?? 0) + 1);

    if (!stockStatus) {
      continue;
    }

    const candidate = {
      price: listing.price as number | string | null,
      currency: asString(listing.currency || "JPY"),
      stock_status: stockStatus,
      shop_name: asString(shop?.name)
    };
    const current = bestByGroup.get(groupId);

    if (
      !current ||
      listingPriority(candidate.stock_status) < listingPriority(current.stock_status) ||
      (
        listingPriority(candidate.stock_status) === listingPriority(current.stock_status) &&
        priceValue(candidate.price) < priceValue(current.price)
      )
    ) {
      bestByGroup.set(groupId, candidate);
    }
  }

  return items.map((item) => ({
    ...item,
    listing_count: countByGroup.get(productGroupKey(item)) ?? 0,
    representative_listing: bestByGroup.get(productGroupKey(item))
  }));
}

async function runProductQuery(args: ProductSearchArgs) {
  const supabase = getReadSupabase();
  if (!supabase) {
    return { configured: false, items: [] as ProductCardItem[] };
  }

  const limit = args.limit ?? 24;
  const term = cleanSearchTerm(args.q ?? "");
  const buildQuery = (fields = productSearchFields) => {
    let query = supabase.from("product_search_view").select("*").limit(limit);

    if (term) {
      query = query.or(searchOr(term, fields));
    }

    if (args.lineType) {
      query = query.eq("line_type", args.lineType);
    }

    if (args.productType) {
      query = query.eq("product_type", args.productType);
    }

    return query;
  };

  let response = await buildQuery().order("created_at", { ascending: false });

  if (term && response.error && isSearchColumnError(response.error)) {
    response = await buildQuery(fallbackProductSearchFields).order("created_at", {
      ascending: false
    });
  }

  if (response.error) {
    response = await buildQuery(term && isSearchColumnError(response.error) ? fallbackProductSearchFields : productSearchFields);
  }

  const enrichedItems = await attachProductImages(await enrichProductCards(
    ((response.data ?? []) as ProductCardItem[]).slice(0, limit)
  ));

  return {
    configured: true,
    items: await attachRepresentativeListings(enrichedItems),
    error: response.error?.message
  };
}

async function aliasProductGroupIds(term: string) {
  const supabase = getReadSupabase();
  if (!supabase || !term) {
    return [];
  }

  const { data, error } = await supabase
    .from("aliases")
    .select("target_type, target_id, alias")
    .ilike("alias", `%${term}%`)
    .limit(100);

  if (error || !data?.length) {
    return [];
  }

  const workIds: string[] = [];
  const characterIds: string[] = [];
  const manufacturerIds: string[] = [];
  const groupIds = new Set<string>();

  for (const alias of data as AnyRecord[]) {
    const targetType = asString(alias.target_type).toUpperCase();
    const targetId = asString(alias.target_id);
    if (!targetId) {
      continue;
    }

    if (targetType === "WORK" || targetType === "WORKS") {
      workIds.push(targetId);
    } else if (targetType === "CHARACTER" || targetType === "CHARACTERS") {
      characterIds.push(targetId);
    } else if (targetType === "MANUFACTURER" || targetType === "MANUFACTURERS") {
      manufacturerIds.push(targetId);
    } else if (targetType === "PRODUCT_GROUP" || targetType === "PRODUCT_GROUPS") {
      groupIds.add(targetId);
    }
  }

  const collectGroupIds = async (column: string, ids: string[]) => {
    const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
    if (!uniqueIds.length) {
      return;
    }

    const response = await supabase
      .from("product_groups")
      .select("id")
      .in(column, uniqueIds)
      .limit(200);

    if (response.error) {
      return;
    }

    for (const group of (response.data ?? []) as AnyRecord[]) {
      const groupId = asString(group.id);
      if (groupId) {
        groupIds.add(groupId);
      }
    }
  };

  await collectGroupIds("work_id", workIds);
  await collectGroupIds("character_id", characterIds);
  await collectGroupIds("manufacturer_id", manufacturerIds);

  return Array.from(groupIds);
}

async function productsByGroupIds(groupIds: string[], limit: number) {
  const supabase = getReadSupabase();
  if (!supabase || groupIds.length === 0) {
    return [];
  }

  const byProductGroup = await supabase
    .from("product_search_view")
    .select("*")
    .in("product_group_id", groupIds)
    .limit(limit);

  if (!byProductGroup.error && byProductGroup.data?.length) {
    const enriched = await attachProductImages(
      await enrichProductCards((byProductGroup.data ?? []) as ProductCardItem[])
    );
    return attachRepresentativeListings(enriched);
  }

  const byId = await supabase
    .from("product_search_view")
    .select("*")
    .in("id", groupIds)
    .limit(limit);

  let fallbackItems = ((byId.data ?? []) as ProductCardItem[]) || [];

  if (!fallbackItems.length) {
    let groupsResponse: { data: unknown[] | null; error: { message: string } | null } = await supabase
      .from("product_groups")
      .select("*, manufacturers(name_kr, name)")
      .in("id", groupIds)
      .limit(limit);

    if (groupsResponse.error) {
      groupsResponse = await supabase
        .from("product_groups")
        .select("*")
        .in("id", groupIds)
        .limit(limit);
    }

    fallbackItems = ((groupsResponse.data ?? []) as AnyRecord[]).map(productGroupToCard);
  }

  const enriched = await attachProductImages(await enrichProductCards(fallbackItems));
  return attachRepresentativeListings(enriched);
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
  const supabase = getReadSupabase();
  if (!supabase) {
    return { configured: false, items: [] as ProductCardItem[] };
  }

  let response: { data: unknown[] | null; error: { message: string } | null } = await supabase
    .from("product_groups")
    .select("*, manufacturers(name_kr, name)")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (response.error) {
    response = await supabase
      .from("product_groups")
      .select("*")
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(limit);
  }

  return {
    configured: true,
    items: await attachRepresentativeListings(
      await attachProductImages(((response.data ?? []) as AnyRecord[]).map(productGroupToCard))
    ),
    error: response.error?.message
  };
}

export async function preorderProducts(limit = 8) {
  const supabase = getReadSupabase();
  if (!supabase) {
    return { configured: false, items: [] as ProductCardItem[] };
  }

  const preorderStatuses = ["PREORDER_OPEN", "PREORDER_CLOSED", "COMING_SOON"];
  const response = await supabase
    .from("shop_listings")
    .select("stock_status, product_variants(product_groups(*))")
    .eq("is_visible", true)
    .in("stock_status", preorderStatuses)
    .limit(limit * 4);

  const groups = ((response.data ?? []) as AnyRecord[])
    .map(productGroupFromListing)
    .filter((group): group is AnyRecord => Boolean(group))
    .map(productGroupToCard);

  return {
    configured: true,
    items: await attachRepresentativeListings(
      await attachProductImages(dedupeProducts(groups).slice(0, limit))
    ),
    error: response.error?.message
  };
}

export async function popularWorks(limit = 8) {
  const supabase = getReadSupabase();
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
