"use server";

import { revalidatePath } from "next/cache";
import { generateProductNames, valueText } from "@/lib/admin/naming";
import { getServiceSupabase } from "@/lib/supabase/server";

export type BulkAddRow = Record<string, string>;

export type BulkAddRowResult = {
  rowNumber: number;
  status: "created" | "skipped" | "error";
  message: string;
  productSlug?: string;
  productUrl?: string;
  adminUrl?: string;
};

export type BulkAddState = {
  ok: boolean;
  message: string;
  summary: {
    created: number;
    skipped: number;
    error: number;
  };
  results: BulkAddRowResult[];
};

type Payload = Record<string, string | number | boolean | null>;

const initialSummary = { created: 0, skipped: 0, error: 0 };

function nullable(value: unknown) {
  const text = valueText(value);
  return text || null;
}

function numberOrNull(value: unknown) {
  const text = valueText(value);
  const number = Number(text);
  return text && Number.isFinite(number) ? number : null;
}

function requireFields(row: BulkAddRow, fields: string[]) {
  return fields.find((field) => !valueText(row[field])) ?? null;
}

function generatedFor(row: BulkAddRow) {
  const generated = generateProductNames({
    workKr: row.work_kr,
    workJp: row.work_jp,
    workEn: row.work_en,
    workSlug: row.work_slug,
    characterKr: row.character_kr,
    characterJp: row.character_jp,
    characterEn: row.character_en,
    characterSlug: row.character_slug,
    manufacturerKr: row.manufacturer_kr,
    manufacturerJp: row.manufacturer_jp,
    manufacturerEn: row.manufacturer_en,
    manufacturerSlug: row.manufacturer_slug,
    versionKr: row.version_kr,
    versionJp: row.version_jp,
    versionEn: row.version_en,
    lineType: row.line_type
  });

  return {
    displayNameKr: valueText(row.display_name_kr) || generated.displayNameKr,
    canonicalNameJp: valueText(row.canonical_name_jp) || generated.canonicalNameJp,
    displayNameEn: valueText(row.display_name_en) || generated.displayNameEn,
    productSlug: valueText(row.product_slug) || generated.slug
  };
}

async function findId(
  supabase: NonNullable<ReturnType<typeof getServiceSupabase>>,
  table: string,
  match: Record<string, string>
) {
  let query = supabase.from(table).select("id").limit(1);
  for (const [column, value] of Object.entries(match)) {
    query = query.eq(column, value);
  }

  const { data, error } = await query.maybeSingle();
  return { id: data?.id ? String(data.id) : "", error: error?.message ?? null };
}

async function findOrCreate(
  supabase: NonNullable<ReturnType<typeof getServiceSupabase>>,
  table: string,
  match: Record<string, string>,
  payload: Payload
) {
  const found = await findId(supabase, table, match);
  if (found.error || found.id) {
    return found;
  }

  const { data, error } = await supabase.from(table).insert(payload).select("id").single();
  return { id: data?.id ? String(data.id) : "", error: error?.message ?? null };
}

async function saveRow(row: BulkAddRow, rowNumber: number): Promise<BulkAddRowResult> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return {
      rowNumber,
      status: "error",
      message: "Supabase service role environment variables are not configured."
    };
  }

  const names = generatedFor(row);
  const normalizedRow: BulkAddRow = {
    ...row,
    display_name_kr: names.displayNameKr,
    canonical_name_jp: names.canonicalNameJp,
    display_name_en: names.displayNameEn,
    product_slug: names.productSlug
  };

  const missing = requireFields(normalizedRow, [
    "work_kr",
    "work_jp",
    "work_slug",
    "character_kr",
    "character_jp",
    "character_slug",
    "manufacturer_kr",
    "manufacturer_slug",
    "display_name_kr",
    "canonical_name_jp",
    "product_slug",
    "line_type",
    "product_type",
    "shop_slug",
    "raw_shop_name",
    "listing_url"
  ]);

  if (missing) {
    return { rowNumber, status: "error", message: `${missing} is required.` };
  }

  const shop = await findId(supabase, "shops", { slug: normalizedRow.shop_slug });
  if (shop.error) {
    return { rowNumber, status: "error", message: shop.error };
  }
  if (!shop.id) {
    return {
      rowNumber,
      status: "error",
      message: `Shop slug "${normalizedRow.shop_slug}" was not found.`
    };
  }

  const existingProduct = await findId(supabase, "product_groups", {
    slug: normalizedRow.product_slug
  });
  if (existingProduct.error) {
    return { rowNumber, status: "error", message: existingProduct.error };
  }
  if (existingProduct.id) {
    return {
      rowNumber,
      status: "skipped",
      message: "Product group slug already exists.",
      productSlug: normalizedRow.product_slug,
      productUrl: `/products/${normalizedRow.product_slug}`,
      adminUrl: "/admin/product-groups"
    };
  }

  const work = await findOrCreate(
    supabase,
    "works",
    { slug: normalizedRow.work_slug },
    {
      name_kr: normalizedRow.work_kr,
      name_jp: normalizedRow.work_jp,
      name_en: nullable(normalizedRow.work_en),
      slug: normalizedRow.work_slug
    }
  );
  if (work.error || !work.id) {
    return { rowNumber, status: "error", message: work.error || "Work could not be saved." };
  }

  const character = await findOrCreate(
    supabase,
    "characters",
    { work_id: work.id, slug: normalizedRow.character_slug },
    {
      work_id: work.id,
      name_kr: normalizedRow.character_kr,
      name_jp: normalizedRow.character_jp,
      name_en: nullable(normalizedRow.character_en),
      slug: normalizedRow.character_slug
    }
  );
  if (character.error || !character.id) {
    return {
      rowNumber,
      status: "error",
      message: character.error || "Character could not be saved."
    };
  }

  const manufacturer = await findOrCreate(
    supabase,
    "manufacturers",
    { slug: normalizedRow.manufacturer_slug },
    {
      name_kr: normalizedRow.manufacturer_kr,
      name_jp: nullable(normalizedRow.manufacturer_jp),
      name_en: nullable(normalizedRow.manufacturer_en),
      slug: normalizedRow.manufacturer_slug
    }
  );
  if (manufacturer.error || !manufacturer.id) {
    return {
      rowNumber,
      status: "error",
      message: manufacturer.error || "Manufacturer could not be saved."
    };
  }

  const productGroupResponse = await supabase
    .from("product_groups")
    .insert({
      work_id: work.id,
      character_id: character.id,
      manufacturer_id: manufacturer.id,
      display_name_kr: normalizedRow.display_name_kr,
      canonical_name_jp: normalizedRow.canonical_name_jp,
      display_name_en: nullable(normalizedRow.display_name_en),
      slug: normalizedRow.product_slug,
      product_type: normalizedRow.product_type,
      line_type: normalizedRow.line_type,
      scale: nullable(normalizedRow.scale),
      status: "ACTIVE",
      version_name_kr: nullable(normalizedRow.version_kr),
      version_name_jp: nullable(normalizedRow.version_jp),
      version_name_en: nullable(normalizedRow.version_en),
      main_image_url: nullable(normalizedRow.main_image_url)
    })
    .select("id, slug")
    .single();

  if (productGroupResponse.error) {
    return { rowNumber, status: "error", message: productGroupResponse.error.message };
  }

  const variantResponse = await supabase
    .from("product_variants")
    .insert({
      product_group_id: String(productGroupResponse.data.id),
      variant_label_kr: nullable(normalizedRow.variant_label_kr),
      edition_type: nullable(normalizedRow.edition_type),
      condition_type: nullable(normalizedRow.condition_type)
    })
    .select("id")
    .single();

  if (variantResponse.error) {
    return { rowNumber, status: "error", message: variantResponse.error.message };
  }

  const listingResponse = await supabase.from("shop_listings").insert({
    variant_id: String(variantResponse.data.id),
    shop_id: shop.id,
    raw_shop_name: normalizedRow.raw_shop_name,
    price: numberOrNull(normalizedRow.price),
    currency: valueText(normalizedRow.currency) || "JPY",
    stock_status: valueText(normalizedRow.stock_status) || "PREORDER_OPEN",
    is_visible: true,
    review_status: "APPROVED",
    is_affiliate: Boolean(valueText(normalizedRow.affiliate_url)),
    listing_url: normalizedRow.listing_url,
    affiliate_url: nullable(normalizedRow.affiliate_url)
  });

  if (listingResponse.error) {
    return { rowNumber, status: "error", message: listingResponse.error.message };
  }

  return {
    rowNumber,
    status: "created",
    message: "Created.",
    productSlug: normalizedRow.product_slug,
    productUrl: `/products/${normalizedRow.product_slug}`,
    adminUrl: "/admin/product-groups"
  };
}

export async function bulkAddProducts(
  _previousState: BulkAddState,
  formData: FormData
): Promise<BulkAddState> {
  const rowsJson = formData.get("rows_json");
  if (typeof rowsJson !== "string" || !rowsJson.trim()) {
    return {
      ok: false,
      message: "CSV preview rows are required.",
      summary: initialSummary,
      results: []
    };
  }

  let rows: BulkAddRow[];
  try {
    rows = JSON.parse(rowsJson);
  } catch {
    return {
      ok: false,
      message: "Preview data could not be read. Please parse the CSV again.",
      summary: initialSummary,
      results: []
    };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      ok: false,
      message: "At least one CSV row is required.",
      summary: initialSummary,
      results: []
    };
  }

  const results: BulkAddRowResult[] = [];
  for (const [index, row] of rows.entries()) {
    try {
      results.push(await saveRow(row, index + 2));
    } catch (error) {
      results.push({
        rowNumber: index + 2,
        status: "error",
        message: error instanceof Error ? error.message : "Unexpected row error."
      });
    }
  }

  const summary = results.reduce(
    (counts, result) => {
      counts[result.status] += 1;
      return counts;
    },
    { ...initialSummary }
  );

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/product-groups");
  revalidatePath("/admin/product-variants");
  revalidatePath("/admin/shop-listings");

  return {
    ok: summary.error === 0,
    message: `Bulk add finished. Created ${summary.created}, skipped ${summary.skipped}, errors ${summary.error}.`,
    summary,
    results
  };
}
