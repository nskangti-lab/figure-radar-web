"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Save, Wand2 } from "lucide-react";
import {
  bulkAddProducts,
  type BulkAddRow,
  type BulkAddState
} from "@/lib/admin/bulk-add-actions";
import { generateProductNames, valueText } from "@/lib/admin/naming";

const initialState: BulkAddState = {
  ok: false,
  message: "",
  summary: { created: 0, skipped: 0, error: 0 },
  results: []
};

const sampleHeaders = [
  "work_kr",
  "work_jp",
  "work_en",
  "work_slug",
  "character_kr",
  "character_jp",
  "character_en",
  "character_slug",
  "manufacturer_kr",
  "manufacturer_jp",
  "manufacturer_en",
  "manufacturer_slug",
  "version_kr",
  "version_jp",
  "version_en",
  "line_type",
  "product_type",
  "scale",
  "display_name_kr",
  "canonical_name_jp",
  "display_name_en",
  "product_slug",
  "edition_type",
  "condition_type",
  "variant_label_kr",
  "price",
  "currency",
  "stock_status",
  "shop_slug",
  "raw_shop_name",
  "listing_url",
  "affiliate_url"
];

const sampleValues = [
  "\ucd5c\uc560\uc758 \uc544\uc774",
  "\u3010\u63a8\u3057\u306e\u5b50\u3011",
  "Oshi no Ko",
  "oshi-no-ko",
  "\ub8e8\ube44",
  "\u30eb\u30d3\u30fc",
  "Ruby",
  "ruby",
  "\ubc18\ud504\ub808\uc2a4\ud1a0",
  "\u30d0\u30f3\u30d7\u30ec\u30b9\u30c8",
  "BANPRESTO",
  "banpresto",
  "B\ucf54\ub9c8\uce58 Ver.",
  "B\u5c0f\u753aVer.",
  "B-Komachi Ver.",
  "PRIZE_FIGURE",
  "COMPLETE_FIGURE",
  "1/7",
  "",
  "",
  "",
  "",
  "standard",
  "new",
  "",
  "2480",
  "JPY",
  "PREORDER_OPEN",
  "amiami",
  "\uc544\ubbf8\uc544\ubbf8",
  "https://example.com/ruby-b-komachi",
  ""
];

const sampleCsv = `${sampleHeaders.join(",")}\n${sampleValues.join(",")}`;

type DuplicateStatus = "duplicate" | "new";
type ShopStatus = "confirmed" | "missing";

type PreviewRow = {
  values: BulkAddRow;
  rowNumber: number;
  previewDisplayNameKr: string;
  previewCanonicalNameJp: string;
  previewProductSlug: string;
  duplicateStatus: DuplicateStatus;
  shopStatus: ShopStatus;
};

type BulkAddFormProps = {
  productSlugs: string[];
  shopSlugs: string[];
};

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<BulkAddRow>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

function duplicateLabel(status: DuplicateStatus) {
  return status === "duplicate" ? "\uc911\ubcf5" : "\uc2e0\uaddc";
}

function shopLabel(status: ShopStatus) {
  return status === "confirmed" ? "\ud655\uc778\ub428" : "\uc0f5 \uc5c6\uc74c";
}

function withPreview(
  row: BulkAddRow,
  index: number,
  existingProductSlugs: Set<string>,
  existingShopSlugs: Set<string>
): PreviewRow {
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

  const previewProductSlug = valueText(row.product_slug) || generated.slug;
  const shopSlug = valueText(row.shop_slug);

  return {
    values: row,
    rowNumber: index + 2,
    previewDisplayNameKr: valueText(row.display_name_kr) || generated.displayNameKr,
    previewCanonicalNameJp: valueText(row.canonical_name_jp) || generated.canonicalNameJp,
    previewProductSlug,
    duplicateStatus: existingProductSlugs.has(previewProductSlug) ? "duplicate" : "new",
    shopStatus: shopSlug && existingShopSlugs.has(shopSlug) ? "confirmed" : "missing"
  };
}

export function BulkAddForm({ productSlugs, shopSlugs }: BulkAddFormProps) {
  const [state, formAction, isPending] = useActionState(bulkAddProducts, initialState);
  const [csv, setCsv] = useState("");
  const existingProductSlugs = useMemo(() => new Set(productSlugs), [productSlugs]);
  const existingShopSlugs = useMemo(() => new Set(shopSlugs), [shopSlugs]);
  const previewRows = useMemo(
    () =>
      parseCsv(csv).map((row, index) =>
        withPreview(row, index, existingProductSlugs, existingShopSlugs)
      ),
    [csv, existingProductSlugs, existingShopSlugs]
  );
  const submitRows = useMemo(() => previewRows.map((row) => row.values), [previewRows]);

  function insertSampleCsv() {
    if (
      csv.trim() &&
      !window.confirm(
        "\uae30\uc874 CSV \uc785\ub825\uac12\uc744 \uc0d8\ud50c CSV\ub85c \ub36e\uc5b4\uc4f8\uae4c\uc694?"
      )
    ) {
      return;
    }

    setCsv(sampleCsv);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList aria-hidden="true" className="h-5 w-5 text-mint" />
            <h2 className="font-bold text-ink">CSV Input</h2>
          </div>
          <button
            type="button"
            onClick={insertSampleCsv}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:border-mint"
          >
            <Wand2 aria-hidden="true" className="h-4 w-4 text-mint" />
            {"\uc0d8\ud50c CSV \ub123\uae30"}
          </button>
        </div>
        <textarea
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          placeholder={`${sampleHeaders.join(",")}\n`}
          className="min-h-64 w-full rounded-md border border-line bg-white px-3 py-2 font-mono text-xs outline-none focus:border-mint"
        />
        <p className="mt-2 text-xs text-neutral-500">
          Header row is required. Empty product_slug uses the standard quick-add naming rules.
        </p>
      </section>

      <section className="rounded-lg border border-line bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-ink">Preview</h2>
          <span className="text-sm text-neutral-500">{previewRows.length} rows</span>
        </div>
        {previewRows.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Work KR</th>
                  <th className="px-3 py-2">Character KR</th>
                  <th className="px-3 py-2">Manufacturer KR</th>
                  <th className="px-3 py-2">Display Name KR</th>
                  <th className="px-3 py-2">Canonical Name JP</th>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">Line Type</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Stock Status</th>
                  <th className="px-3 py-2">Listing URL</th>
                  <th className="px-3 py-2">Duplicate</th>
                  <th className="px-3 py-2">Shop</th>
                  <th className="px-3 py-2">Shop Slug</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {previewRows.map((row) => (
                  <tr
                    key={`${row.rowNumber}-${row.previewProductSlug}`}
                    className={
                      row.duplicateStatus === "duplicate" || row.shopStatus === "missing"
                        ? "bg-amber-50"
                        : undefined
                    }
                  >
                    <td className="px-3 py-2 text-neutral-500">{row.rowNumber}</td>
                    <td className="px-3 py-2">{row.values.work_kr || "-"}</td>
                    <td className="px-3 py-2">{row.values.character_kr || "-"}</td>
                    <td className="px-3 py-2">{row.values.manufacturer_kr || "-"}</td>
                    <td className="px-3 py-2 font-semibold text-ink">
                      {row.previewDisplayNameKr || "-"}
                    </td>
                    <td className="px-3 py-2">{row.previewCanonicalNameJp || "-"}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {row.previewProductSlug || "-"}
                    </td>
                    <td className="px-3 py-2">{row.values.line_type || "-"}</td>
                    <td className="px-3 py-2">{row.values.price || "-"}</td>
                    <td className="px-3 py-2">{row.values.stock_status || "-"}</td>
                    <td className="max-w-72 truncate px-3 py-2">
                      {row.values.listing_url || "-"}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={row.duplicateStatus === "duplicate" ? "warning" : "success"}>
                        {duplicateLabel(row.duplicateStatus)}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={row.shopStatus === "missing" ? "danger" : "success"}>
                        {shopLabel(row.shopStatus)}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-2">{row.values.shop_slug || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-md bg-neutral-50 px-3 py-6 text-center text-sm text-neutral-500">
            Paste CSV with a header row to preview generated product names.
          </p>
        )}
      </section>

      <form action={formAction}>
        <input type="hidden" name="rows_json" value={JSON.stringify(submitRows)} />
        <button
          type="submit"
          disabled={isPending || previewRows.length === 0}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-semibold text-white transition hover:bg-coral disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {isPending ? "Saving..." : "Bulk add products"}
        </button>
      </form>

      {state.message ? (
        <section
          className={`rounded-lg border p-4 ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <h2 className="font-bold">{state.message}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-md bg-white px-3 py-1">Created {state.summary.created}</span>
            <span className="rounded-md bg-white px-3 py-1">Skipped {state.summary.skipped}</span>
            <span className="rounded-md bg-white px-3 py-1">Errors {state.summary.error}</span>
          </div>
          {state.results.length ? (
            <div className="mt-4 overflow-x-auto rounded-md bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Message</th>
                    <th className="px-3 py-2">Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {state.results.map((result) => (
                    <tr
                      key={`${result.rowNumber}-${result.status}-${result.productSlug ?? result.message}`}
                    >
                      <td className="px-3 py-2">{result.rowNumber}</td>
                      <td className="px-3 py-2 font-semibold">{result.status}</td>
                      <td className="px-3 py-2">{result.message}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          {result.productUrl ? (
                            <Link className="underline" href={result.productUrl}>
                              Product
                            </Link>
                          ) : null}
                          {result.adminUrl ? (
                            <Link className="underline" href={result.adminUrl}>
                              Admin
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function StatusBadge({
  children,
  tone
}: {
  children: React.ReactNode;
  tone: "success" | "warning" | "danger";
}) {
  const className =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "warning"
        ? "bg-amber-100 text-amber-800 ring-amber-200"
        : "bg-red-50 text-red-700 ring-red-200";

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ring-1 ${className}`}>
      {children}
    </span>
  );
}
