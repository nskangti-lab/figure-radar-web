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

  if (!listingId) {
    return NextResponse.json(
      { ok: false, error: "listingId is required." },
      { status: 400 }
    );
  }

  const clickedAt = new Date().toISOString();
  const payloads = [
    {
      shop_listing_id: listingId,
      product_variant_id: variantId,
      product_group_id: productGroupId,
      target_url: targetUrl,
      referrer: headerStore.get("referer"),
      user_agent: headerStore.get("user-agent"),
      ip_address:
        headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        headerStore.get("x-real-ip"),
      clicked_at: clickedAt
    },
    {
      shop_listing_id: listingId,
      product_group_id: productGroupId,
      clicked_at: clickedAt
    },
    {
      shop_listing_id: listingId,
      clicked_at: clickedAt
    },
    {
      listing_id: listingId,
      clicked_at: clickedAt
    }
  ];

  let lastError = "";
  for (const payload of payloads) {
    const compactPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== null && value !== undefined)
    );
    const { error } = await supabase.from("click_logs").insert(compactPayload);

    if (!error) {
      return NextResponse.json({ ok: true });
    }

    lastError = error.message;
  }

  return NextResponse.json({ ok: false, error: lastError }, { status: 500 });
}
