import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase service role environment variables are not configured." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const headerStore = await headers();
  const listingId = cleanString(body.listingId);
  const variantId = cleanString(body.variantId);
  const productGroupId = cleanString(body.productGroupId);
  const targetUrl = cleanString(body.targetUrl);

  const missing = [
    ["listingId", listingId],
    ["variantId", variantId],
    ["productGroupId", productGroupId],
    ["targetUrl", targetUrl]
  ].find(([, value]) => !value);

  if (missing) {
    return NextResponse.json(
      { ok: false, error: `${missing[0]} is required.` },
      { status: 400 }
    );
  }

  const payload = {
    shop_listing_id: listingId,
    product_group_id: productGroupId,
    variant_id: variantId,
    clicked_url: targetUrl,
    referrer: headerStore.get("referer"),
    user_agent: headerStore.get("user-agent"),
    clicked_at: new Date().toISOString()
  };
  const { error } = await supabase.from("click_logs").insert(payload);

  if (!error) {
    return NextResponse.json({ ok: true });
  }

  if (process.env.NODE_ENV !== "production") {
    console.error("click_logs insert failed", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
  }

  return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
}
