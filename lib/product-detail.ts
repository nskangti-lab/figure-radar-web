import { asString } from "@/lib/format";
import { getPublicSupabase } from "@/lib/supabase/server";
import type { AnyRecord } from "@/lib/types";

export type ProductDetailResult = {
  configured: boolean;
  group: AnyRecord | null;
  variants: AnyRecord[];
  listingsByVariant: Record<string, AnyRecord[]>;
};

export async function getProductDetail(slug: string): Promise<ProductDetailResult> {
  const supabase = getPublicSupabase();
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
      listingsByVariant: {}
    };
  }

  let listingsResponse = await supabase
    .from("shop_listings")
    .select("*, shops(*)")
    .in("variant_id", variantIds)
    .order("updated_at", { ascending: false });

  if (listingsResponse.error) {
    listingsResponse = await supabase
      .from("shop_listings")
      .select("*")
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

  return {
    configured: true,
    group,
    variants,
    listingsByVariant
  };
}
