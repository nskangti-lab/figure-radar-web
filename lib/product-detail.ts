import { asString } from "@/lib/format";
import { getPublicSupabase, getServiceSupabase } from "@/lib/supabase/server";
import type { AnyRecord } from "@/lib/types";

export type ProductDetailResult = {
  configured: boolean;
  group: AnyRecord | null;
  variants: AnyRecord[];
  listingsByVariant: Record<string, AnyRecord[]>;
  imageUrl?: string;
};

type SupabaseReader = NonNullable<ReturnType<typeof getPublicSupabase>>;

function imageUrlFromRecord(record: AnyRecord | null | undefined) {
  if (!record) {
    return "";
  }

  return asString(record.image_url || record.url || record.src || record.public_url).trim();
}

function listingStatusPriority(status: unknown) {
  const value = asString(status).toUpperCase();
  if (value === "IN_STOCK") {
    return 0;
  }
  if (value === "PREORDER_OPEN") {
    return 1;
  }
  if (value === "COMING_SOON") {
    return 2;
  }
  if (value === "UNKNOWN") {
    return 3;
  }
  if (value === "PREORDER_CLOSED") {
    return 4;
  }
  if (value === "SOLD_OUT") {
    return 5;
  }

  return 6;
}

function listingPrice(value: unknown) {
  const price = typeof value === "number" ? value : Number.parseFloat(asString(value));
  return Number.isFinite(price) ? price : Number.POSITIVE_INFINITY;
}

function sortListings(listings: AnyRecord[]) {
  return [...listings].sort((left, right) => {
    const priorityDiff =
      listingStatusPriority(left.stock_status) - listingStatusPriority(right.stock_status);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return listingPrice(left.price) - listingPrice(right.price);
  });
}

async function productDetailImage(
  supabase: SupabaseReader,
  group: AnyRecord,
  listings: AnyRecord[] = []
) {
  const mainImageUrl = asString(group.main_image_url).trim();
  if (mainImageUrl) {
    return mainImageUrl;
  }

  const groupId = asString(group.id);
  if (groupId) {
    const imagesResponse = await supabase
      .from("images")
      .select("*")
      .eq("target_type", "PRODUCT_GROUP")
      .eq("target_id", groupId)
      .eq("is_primary", true)
      .limit(5);

    if (!imagesResponse.error) {
      for (const image of (imagesResponse.data ?? []) as AnyRecord[]) {
        const usageStatus = asString(image.usage_status).toUpperCase();
        const imageUrl = imageUrlFromRecord(image);
        if (imageUrl && usageStatus !== "HIDDEN" && usageStatus !== "REMOVED") {
          return imageUrl;
        }
      }
    }
  }

  for (const listing of listings) {
    const isVisible = listing.is_visible === true || asString(listing.is_visible).toLowerCase() === "true";
    if (!isVisible) {
      continue;
    }

    const imageUrl = imageUrlFromRecord(listing);
    if (imageUrl) {
      return imageUrl;
    }
  }

  return "";
}

export async function getProductDetail(slug: string): Promise<ProductDetailResult> {
  const supabase = getServiceSupabase() ?? getPublicSupabase();
  if (!supabase) {
    return {
      configured: false,
      group: null,
      variants: [],
      listingsByVariant: {}
    };
  }

  let groupResponse = await supabase
    .from("product_groups")
    .select("*, works(*), characters(*), manufacturers(*)")
    .eq("slug", slug)
    .maybeSingle();

  if (groupResponse.error) {
    groupResponse = await supabase
      .from("product_groups")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
  }

  const group = (groupResponse.data as AnyRecord | null) ?? null;
  if (!group) {
    return {
      configured: true,
      group: null,
      variants: [],
      listingsByVariant: {}
    };
  }

  const groupId = asString(group.id);
  let variantsResponse = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_group_id", groupId)
    .order("release_month_jp", { ascending: false });

  if (variantsResponse.error) {
    variantsResponse = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_group_id", groupId);
  }

  const variants = (variantsResponse.data ?? []) as AnyRecord[];
  const variantIds = variants.map((variant) => asString(variant.id)).filter(Boolean);

  if (variantIds.length === 0) {
    return {
      configured: true,
      group,
      variants,
      listingsByVariant: {},
      imageUrl: await productDetailImage(supabase, group)
    };
  }

  let listingsResponse = await supabase
    .from("shop_listings")
    .select("*, shops(*)")
    .eq("is_visible", true)
    .in("variant_id", variantIds)
    .order("updated_at", { ascending: false });

  if (listingsResponse.error) {
    listingsResponse = await supabase
      .from("shop_listings")
      .select("*")
      .eq("is_visible", true)
      .in("variant_id", variantIds);
  }

  const listings = (listingsResponse.data ?? []) as AnyRecord[];
  const listingsByVariant = listings.reduce<Record<string, AnyRecord[]>>(
    (acc, listing) => {
      const variantId = asString(listing.variant_id);
      if (!acc[variantId]) {
        acc[variantId] = [];
      }

      acc[variantId].push(listing);
      return acc;
    },
    {}
  );

  for (const [variantId, variantListings] of Object.entries(listingsByVariant)) {
    listingsByVariant[variantId] = sortListings(variantListings);
  }

  return {
    configured: true,
    group,
    variants,
    listingsByVariant,
    imageUrl: await productDetailImage(supabase, group, listings)
  };
}
