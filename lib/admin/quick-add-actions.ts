"use server";

import { revalidatePath } from "next/cache";
import { getServiceSupabase } from "@/lib/supabase/server";

export type QuickAddState = {
  ok: boolean;
  message: string;
  productUrl?: string;
  adminUrl?: string;
};

type Match = Record<string, string>;
type Payload = Record<string, string | number | boolean | null>;

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, name: string) {
  return text(formData, name) || null;
}

function nullableNumber(formData: FormData, name: string) {
  const value = Number(text(formData, name));
  return Number.isFinite(value) && text(formData, name) ? value : null;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `item-${Date.now()}`;
}

async function findByMatch(table: string, match: Match) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return { data: null, error: "Supabase service role environment variables are not configured." };
  }

  let query = supabase.from(table).select("id").limit(1);
  for (const [column, value] of Object.entries(match)) {
    query = query.eq(column, value);
  }

  const { data, error } = await query.maybeSingle();
  return { data, error: error?.message ?? null };
}

async function findOrCreate(table: string, match: Match, payload: Payload) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return { id: "", error: "Supabase service role environment variables are not configured." };
  }

  const found = await findByMatch(table, match);
  if (found.error) {
    return { id: "", error: found.error };
  }

  if (found.data?.id) {
    return { id: String(found.data.id), error: null };
  }

  const { data, error } = await supabase.from(table).insert(payload).select("id").single();
  return { id: data?.id ? String(data.id) : "", error: error?.message ?? null };
}

export async function quickAddProduct(
  _previousState: QuickAddState,
  formData: FormData
): Promise<QuickAddState> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase service role environment variables are not configured."
    };
  }

  const minimalMode = formData.has("minimal_mode");

  const workNameKr = text(formData, "work_name_kr");
  const workNameJp = text(formData, "work_name_jp") || (minimalMode ? workNameKr : "");
  const workSlug = text(formData, "work_slug") || slugify(workNameKr || workNameJp);

  const characterNameKr = text(formData, "character_name_kr");
  const characterNameJp =
    text(formData, "character_name_jp") || (minimalMode ? characterNameKr : "");
  const characterSlug = text(formData, "character_slug") || slugify(characterNameKr || characterNameJp);

  const manufacturerNameKr = text(formData, "manufacturer_name_kr");
  const manufacturerSlug = text(formData, "manufacturer_slug") || slugify(manufacturerNameKr);

  const displayNameKr = text(formData, "display_name_kr");
  const canonicalNameJp =
    text(formData, "canonical_name_jp") || (minimalMode ? displayNameKr : "");
  const productGroupSlug = text(formData, "product_group_slug") || slugify(displayNameKr);

  const lineType = text(formData, "line_type");
  const productType = text(formData, "product_type");
  const shopId = text(formData, "shop_id");
  const rawShopName = text(formData, "raw_shop_name");
  const listingUrl = text(formData, "listing_url");

  const required = [
    ["Work KR name", workNameKr],
    ["Work JP name", workNameJp],
    ["Work slug", workSlug],
    ["Character KR name", characterNameKr],
    ["Character JP name", characterNameJp],
    ["Character slug", characterSlug],
    ["Manufacturer KR name", manufacturerNameKr],
    ["Manufacturer slug", manufacturerSlug],
    ["Display name KR", displayNameKr],
    ["Canonical name JP", canonicalNameJp],
    ["Product group slug", productGroupSlug],
    ["Line type", lineType],
    ["Product type", productType],
    ["Shop", shopId],
    ["Raw shop name", rawShopName],
    ["Listing URL", listingUrl]
  ];

  const missing = required.find(([, value]) => !value);
  if (missing) {
    return { ok: false, message: `${missing[0]} is required.` };
  }

  const existingProductGroup = await findByMatch("product_groups", { slug: productGroupSlug });
  if (existingProductGroup.error) {
    return { ok: false, message: existingProductGroup.error };
  }

  if (existingProductGroup.data?.id) {
    return {
      ok: false,
      message: "A product group with this slug already exists. Use the existing record instead.",
      adminUrl: "/admin/product-groups"
    };
  }

  const work = await findOrCreate(
    "works",
    { slug: workSlug },
    {
      name_kr: workNameKr,
      name_jp: workNameJp,
      name_en: nullableText(formData, "work_name_en"),
      slug: workSlug
    }
  );
  if (work.error) {
    return { ok: false, message: work.error };
  }

  const character = await findOrCreate(
    "characters",
    { work_id: work.id, slug: characterSlug },
    {
      work_id: work.id,
      name_kr: characterNameKr,
      name_jp: characterNameJp,
      name_en: nullableText(formData, "character_name_en"),
      slug: characterSlug
    }
  );
  if (character.error) {
    return { ok: false, message: character.error };
  }

  const manufacturer = await findOrCreate(
    "manufacturers",
    { slug: manufacturerSlug },
    {
      name_kr: manufacturerNameKr,
      name_jp: nullableText(formData, "manufacturer_name_jp"),
      name_en: nullableText(formData, "manufacturer_name_en"),
      slug: manufacturerSlug,
      official_url: nullableText(formData, "manufacturer_official_url")
    }
  );
  if (manufacturer.error) {
    return { ok: false, message: manufacturer.error };
  }

  const productGroupPayload: Payload = {
    work_id: work.id,
    character_id: character.id,
    manufacturer_id: manufacturer.id,
    display_name_kr: displayNameKr,
    canonical_name_jp: canonicalNameJp,
    display_name_en: nullableText(formData, "display_name_en"),
    slug: productGroupSlug,
    product_type: productType,
    line_type: lineType,
    scale: nullableText(formData, "scale"),
    status: text(formData, "product_group_status") || "ACTIVE",
    version_name_kr: nullableText(formData, "version_name_kr"),
    version_name_jp: nullableText(formData, "version_name_jp"),
    version_name_en: nullableText(formData, "version_name_en"),
    main_image_url: nullableText(formData, "main_image_url")
  };

  const productGroupResponse = await supabase
    .from("product_groups")
    .insert(productGroupPayload)
    .select("id, slug")
    .single();

  if (productGroupResponse.error) {
    return { ok: false, message: productGroupResponse.error.message };
  }

  const productGroupId = String(productGroupResponse.data.id);
  const variantResponse = await supabase
    .from("product_variants")
    .insert({
      product_group_id: productGroupId,
      variant_label_kr: nullableText(formData, "variant_label_kr"),
      edition_type: nullableText(formData, "edition_type"),
      condition_type: nullableText(formData, "condition_type"),
      jan_code: nullableText(formData, "jan_code"),
      release_month_jp: nullableText(formData, "release_month_jp"),
      official_price_jpy: nullableNumber(formData, "official_price_jpy")
    })
    .select("id")
    .single();

  if (variantResponse.error) {
    return { ok: false, message: variantResponse.error.message };
  }

  const listingResponse = await supabase.from("shop_listings").insert({
    variant_id: String(variantResponse.data.id),
    shop_id: shopId,
    raw_shop_name: rawShopName,
    price: nullableNumber(formData, "price"),
    currency: text(formData, "currency") || "JPY",
    stock_status: text(formData, "stock_status") || "PREORDER_OPEN",
    is_visible: true,
    review_status: "APPROVED",
    is_affiliate: formData.has("is_affiliate"),
    shipping_note: nullableText(formData, "shipping_note"),
    listing_notes: nullableText(formData, "listing_notes"),
    listing_url: listingUrl,
    affiliate_url: nullableText(formData, "affiliate_url")
  });

  if (listingResponse.error) {
    return { ok: false, message: listingResponse.error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/product-groups");
  revalidatePath("/admin/product-variants");
  revalidatePath("/admin/shop-listings");

  return {
    ok: true,
    message: "Product was created.",
    productUrl: `/products/${productGroupSlug}`,
    adminUrl: "/admin/product-groups"
  };
}
