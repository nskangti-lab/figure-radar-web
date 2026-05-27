import type { AnyRecord, ProductCardItem } from "@/lib/types";

export function asString(value: unknown, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
}

export function asDisplay(value: unknown, fallback = "-") {
  const text = asString(value).trim();
  return text || fallback;
}

export function formatPrice(value: unknown, currency = "JPY") {
  const amount =
    typeof value === "number" ? value : Number.parseFloat(asString(value));

  if (!Number.isFinite(amount)) {
    return "-";
  }

  if (currency.toUpperCase() === "KRW") {
    return `${amount.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}원`;
  }

  try {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("ko-KR")} ${currency}`;
  }
}

export function formatMonth(value: unknown) {
  const text = asString(value).trim();
  if (!text) {
    return "-";
  }

  return text.length === 7 ? text.replace("-", ".") : text;
}

export function productTitle(product: ProductCardItem) {
  return (
    asString(product.display_name_kr) ||
    asString(product.canonical_name_jp) ||
    asString(product.name_kr) ||
    asString(product.name) ||
    "이름 없는 상품"
  );
}

export function productImage(product: ProductCardItem) {
  return (
    asString(product.image_url) ||
    asString(product.thumbnail_url) ||
    asString(product.representative_image_url) ||
    asString(product.main_image_url)
  );
}

export function recordId(record: AnyRecord) {
  return asString(record.id || record.product_group_id || record.slug);
}

export function relationName(value: unknown, fields: string[]) {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") {
    return "";
  }

  const record = row as AnyRecord;
  for (const field of fields) {
    const text = asString(record[field]).trim();
    if (text) {
      return text;
    }
  }

  return "";
}

export function optionLabel(record: AnyRecord, fields: string[]) {
  for (const field of fields) {
    const text = asString(record[field]).trim();
    if (text) {
      return text;
    }
  }

  return asString(record.id, "미지정");
}

export function compactText(parts: unknown[]) {
  return parts.map((part) => asString(part).trim()).filter(Boolean).join(" ");
}
