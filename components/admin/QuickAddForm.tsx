"use client";

import { useActionState, useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import { Save, Wand2 } from "lucide-react";
import { quickAddProduct, type QuickAddState } from "@/lib/admin/quick-add-actions";
import type { AdminOption } from "@/lib/types";

type QuickAddFormProps = {
  shops: AdminOption[];
};

type Values = Record<string, string | boolean>;

const initialState: QuickAddState = {
  ok: false,
  message: ""
};

const initialValues: Values = {
  minimal_mode: true,
  product_group_status: "ACTIVE",
  currency: "JPY",
  stock_status: "PREORDER_OPEN",
  is_affiliate: false
};

const lineTypeLabels: Record<string, { kr: string; en: string }> = {
  PRIZE_FIGURE: { kr: "경품 피규어", en: "Prize Figure" },
  SCALE_FIGURE: { kr: "스케일 피규어", en: "Scale Figure" },
  NENDOROID: { kr: "넨도로이드", en: "Nendoroid" },
  FIGMA: { kr: "figma", en: "figma" },
  POP_UP_PARADE: { kr: "POP UP PARADE", en: "POP UP PARADE" },
  ACTION_FIGURE: { kr: "액션 피규어", en: "Action Figure" },
  PLASTIC_MODEL: { kr: "프라모델", en: "Plastic Model" },
  GOODS: { kr: "굿즈", en: "Goods" }
};

const lineTypeSlugs: Record<string, string> = {
  PRIZE_FIGURE: "prize",
  SCALE_FIGURE: "scale",
  NENDOROID: "nendoroid",
  FIGMA: "figma",
  POP_UP_PARADE: "pop-up-parade",
  ACTION_FIGURE: "action",
  PLASTIC_MODEL: "plastic-model",
  GOODS: "goods"
};

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `item-${Date.now()}`;
}

function valueText(value: unknown) {
  return String(value ?? "").trim();
}

function compactJoin(parts: string[], separator = " ") {
  return parts.map(valueText).filter(Boolean).join(separator);
}

function lineTypeLabel(lineType: unknown, locale: "kr" | "en") {
  const key = valueText(lineType).toUpperCase();
  return lineTypeLabels[key]?.[locale] || valueText(lineType).replace(/_/g, " ");
}

function lineTypeSlug(lineType: unknown) {
  const key = valueText(lineType).toUpperCase();
  return lineTypeSlugs[key] || slugify(valueText(lineType));
}

function normalizeVersionForSlug(version: string) {
  return version
    .replace(/\s+(Ver\.?|ver\.?)$/i, "")
    .replace(/\s*(Version|version|버전)$/i, "")
    .trim();
}

export function QuickAddForm({ shops }: QuickAddFormProps) {
  const [state, formAction, isPending] = useActionState(quickAddProduct, initialState);
  const [values, setValues] = useState<Values>(initialValues);
  const minimalMode = values.minimal_mode === true;

  function setValue(name: string, value: string | boolean) {
    setValues((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const target = event.target;
    setValue(target.name, target.value);
  }

  function generateStandardNames() {
    const lineKr = lineTypeLabel(values.line_type, "kr");
    const lineEn = lineTypeLabel(values.line_type, "en");
    const workKr = valueText(values.work_name_kr);
    const workJp = valueText(values.work_name_jp) || workKr;
    const workEn = valueText(values.work_name_en) || valueText(values.work_slug) || workKr;
    const characterKr = valueText(values.character_name_kr);
    const characterJp = valueText(values.character_name_jp) || characterKr;
    const characterEn =
      valueText(values.character_name_en) || valueText(values.character_slug) || characterKr;
    const manufacturerKr = valueText(values.manufacturer_name_kr);
    const manufacturerJp = valueText(values.manufacturer_name_jp) || manufacturerKr;
    const manufacturerEn =
      valueText(values.manufacturer_name_en) ||
      valueText(values.manufacturer_slug) ||
      manufacturerKr;
    const versionKr = valueText(values.version_name_kr);
    const versionJp = valueText(values.version_name_jp);
    const versionEn = valueText(values.version_name_en);

    const displayNameKr = `${workKr} - ${compactJoin([
      characterKr,
      versionKr,
      lineKr
    ])} - ${manufacturerKr}`;
    const canonicalNameJp = `${workJp} - ${compactJoin([
      characterJp,
      versionJp
    ])} - ${lineEn} - ${manufacturerJp}`;
    const displayNameEn = `${workEn} - ${compactJoin([
      characterEn,
      versionEn,
      lineEn
    ])} - ${manufacturerEn}`;
    const versionSlugSource = normalizeVersionForSlug(versionEn || versionKr);
    const slug = [
      values.work_slug || workEn,
      values.character_slug || characterEn,
      versionSlugSource,
      lineTypeSlug(values.line_type),
      values.manufacturer_slug || manufacturerEn
    ]
      .map((part) => slugify(valueText(part)))
      .filter(Boolean)
      .join("-");

    setValues((current) => ({
      ...current,
      display_name_kr: displayNameKr,
      canonical_name_jp: canonicalNameJp,
      display_name_en: displayNameEn,
      product_group_slug: slug
    }));
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <p>{state.message}</p>
          {state.ok ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {state.productUrl ? (
                <Link className="rounded-md bg-ink px-3 py-2 text-white" href={state.productUrl}>
                  Product detail
                </Link>
              ) : null}
              {state.adminUrl ? (
                <Link className="rounded-md border border-line px-3 py-2" href={state.adminUrl}>
                  Admin edit
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          name="minimal_mode"
          checked={minimalMode}
          onChange={(event) => setValue("minimal_mode", event.target.checked)}
          className="h-4 w-4 rounded border-line text-mint focus:ring-mint"
        />
        Minimum input mode
      </label>

      <Section title="Work">
        <TextInput name="work_name_kr" label="Work Name KR" value={values.work_name_kr} onChange={handleChange} required />
        {!minimalMode ? (
          <TextInput name="work_name_jp" label="Work Name JP" value={values.work_name_jp} onChange={handleChange} required />
        ) : null}
        <TextInput name="work_name_en" label="Work Name EN" value={values.work_name_en} onChange={handleChange} />
        <TextInput name="work_slug" label="Work Slug" value={values.work_slug} onChange={handleChange} required />
      </Section>

      <Section title="Character">
        <TextInput name="character_name_kr" label="Character Name KR" value={values.character_name_kr} onChange={handleChange} required />
        {!minimalMode ? (
          <TextInput name="character_name_jp" label="Character Name JP" value={values.character_name_jp} onChange={handleChange} required />
        ) : null}
        <TextInput name="character_name_en" label="Character Name EN" value={values.character_name_en} onChange={handleChange} />
        <TextInput name="character_slug" label="Character Slug" value={values.character_slug} onChange={handleChange} required />
      </Section>

      <Section title="Manufacturer">
        <TextInput name="manufacturer_name_kr" label="Manufacturer Name KR" value={values.manufacturer_name_kr} onChange={handleChange} required />
        <TextInput name="manufacturer_name_jp" label="Manufacturer Name JP" value={values.manufacturer_name_jp} onChange={handleChange} />
        <TextInput name="manufacturer_name_en" label="Manufacturer Name EN" value={values.manufacturer_name_en} onChange={handleChange} />
        <TextInput name="manufacturer_slug" label="Manufacturer Slug" value={values.manufacturer_slug} onChange={handleChange} required />
        <TextInput name="manufacturer_official_url" label="Official URL" type="url" value={values.manufacturer_official_url} onChange={handleChange} />
      </Section>

      <Section title="Product Group">
        <TextInput name="display_name_kr" label="Display Name KR" value={values.display_name_kr} onChange={handleChange} required />
        <TextInput name="canonical_name_jp" label="Canonical Name JP" value={values.canonical_name_jp} onChange={handleChange} required={!minimalMode} />
        <TextInput name="display_name_en" label="Display Name EN" value={values.display_name_en} onChange={handleChange} />
        <TextInput name="product_group_slug" label="Product Group Slug" value={values.product_group_slug} onChange={handleChange} required />
        <TextInput name="product_type" label="Product Type" value={values.product_type} onChange={handleChange} required />
        <TextInput name="line_type" label="Line Type" value={values.line_type} onChange={handleChange} required />
        <TextInput name="scale" label="Scale" value={values.scale} onChange={handleChange} />
        <TextInput name="version_name_kr" label="Version Name KR" value={values.version_name_kr} onChange={handleChange} />
        <TextInput name="version_name_jp" label="Version Name JP" value={values.version_name_jp} onChange={handleChange} />
        <TextInput name="version_name_en" label="Version Name EN" value={values.version_name_en} onChange={handleChange} />
        <TextInput name="main_image_url" label="Main Image URL" type="url" value={values.main_image_url} onChange={handleChange} />
        <SelectInput
          name="product_group_status"
          label="Status"
          value={String(values.product_group_status ?? "ACTIVE")}
          onChange={handleChange}
          options={["ACTIVE", "DRAFT", "ARCHIVED"]}
        />
        <div className="flex flex-wrap items-end gap-2">
          <ToolButton onClick={generateStandardNames}>Generate standard names</ToolButton>
        </div>
      </Section>

      <Section title="Product Variant">
        <TextInput name="variant_label_kr" label="Variant Label KR" value={values.variant_label_kr} onChange={handleChange} />
        <TextInput name="edition_type" label="Edition Type" value={values.edition_type} onChange={handleChange} />
        <TextInput name="condition_type" label="Condition Type" value={values.condition_type} onChange={handleChange} />
        <TextInput name="jan_code" label="JAN Code" value={values.jan_code} onChange={handleChange} />
        <TextInput name="release_month_jp" label="Release Month JP" type="month" value={values.release_month_jp} onChange={handleChange} />
        <TextInput name="official_price_jpy" label="Official Price JPY" type="number" value={values.official_price_jpy} onChange={handleChange} />
      </Section>

      <Section title="Shop Listing">
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-neutral-700">Shop *</span>
          <select
            name="shop_id"
            value={String(values.shop_id ?? "")}
            onChange={handleChange}
            required
            className="h-10 rounded-md border border-line bg-white px-3 outline-none focus:border-mint"
          >
            <option value="">Not selected</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.label}
              </option>
            ))}
          </select>
        </label>
        <TextInput name="raw_shop_name" label="Raw Shop Name" value={values.raw_shop_name} onChange={handleChange} required />
        <TextInput name="price" label="Price" type="number" value={values.price} onChange={handleChange} />
        <TextInput name="currency" label="Currency" value={values.currency} onChange={handleChange} />
        <SelectInput
          name="stock_status"
          label="Stock Status"
          value={String(values.stock_status ?? "PREORDER_OPEN")}
          onChange={handleChange}
          options={["PREORDER_OPEN", "PREORDER_CLOSED", "COMING_SOON", "IN_STOCK", "SOLD_OUT"]}
        />
        <TextInput name="listing_url" label="Listing URL" type="url" value={values.listing_url} onChange={handleChange} required />
        <TextInput name="affiliate_url" label="Affiliate URL" type="url" value={values.affiliate_url} onChange={handleChange} />
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            name="is_affiliate"
            checked={values.is_affiliate === true}
            onChange={(event) => setValue("is_affiliate", event.target.checked)}
            className="h-4 w-4 rounded border-line text-mint focus:ring-mint"
          />
          Affiliate listing
        </label>
        <TextArea name="shipping_note" label="Shipping Note" value={values.shipping_note} onChange={handleChange} />
        <TextArea name="listing_notes" label="Listing Notes" value={values.listing_notes} onChange={handleChange} />
      </Section>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-semibold text-white transition hover:bg-coral disabled:cursor-wait disabled:opacity-70"
      >
        <Save aria-hidden="true" className="h-4 w-4" />
        {isPending ? "Saving..." : "Quick add product"}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-4">
      <h2 className="mb-4 font-bold text-ink">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function TextInput({
  name,
  label,
  value,
  onChange,
  type = "text",
  required = false
}: {
  name: string;
  label: string;
  value: unknown;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-neutral-700">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        name={name}
        type={type}
        value={String(value ?? "")}
        onChange={onChange}
        required={required}
        className="h-10 rounded-md border border-line bg-white px-3 outline-none focus:border-mint"
      />
    </label>
  );
}

function TextArea({
  name,
  label,
  value,
  onChange
}: {
  name: string;
  label: string;
  value: unknown;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <label className="grid gap-1 text-sm md:col-span-2">
      <span className="font-semibold text-neutral-700">{label}</span>
      <textarea
        name={name}
        value={String(value ?? "")}
        onChange={onChange}
        className="min-h-24 rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-mint"
      />
    </label>
  );
}

function SelectInput({
  name,
  label,
  value,
  onChange,
  options
}: {
  name: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-neutral-700">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="h-10 rounded-md border border-line bg-white px-3 outline-none focus:border-mint"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToolButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:border-mint"
    >
      <Wand2 aria-hidden="true" className="h-4 w-4 text-mint" />
      {children}
    </button>
  );
}
