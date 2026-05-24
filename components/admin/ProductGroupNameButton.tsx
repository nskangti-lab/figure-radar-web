"use client";

import { Wand2 } from "lucide-react";

type ProductGroupNameButtonProps = {
  formId: string;
  onGenerated?: (value: string) => void;
};

function elementValue(formId: string, name: string) {
  const element = document.getElementById(`${formId}-${name}`) as
    | HTMLInputElement
    | HTMLSelectElement
    | null;

  if (!element) {
    return "";
  }

  if (element instanceof HTMLSelectElement) {
    return element.selectedOptions[0]?.textContent?.trim() ?? "";
  }

  return element.value.trim();
}

export function ProductGroupNameButton({ formId, onGenerated }: ProductGroupNameButtonProps) {
  function generateName() {
    const target = document.getElementById(`${formId}-display_name_kr`) as
      | HTMLInputElement
      | null;

    if (!target) {
      return;
    }

    const parts = [
      elementValue(formId, "work_id"),
      elementValue(formId, "character_id"),
      elementValue(formId, "manufacturer_id"),
      elementValue(formId, "product_type"),
      elementValue(formId, "line_type"),
      elementValue(formId, "scale"),
      elementValue(formId, "version_name_kr")
    ].filter((part) => part && part !== "Not selected");

    const value = parts.join(" ");
    target.value = value;
    onGenerated?.(value);
    target.focus();
  }

  return (
    <button
      type="button"
      onClick={generateName}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-mint"
    >
      <Wand2 aria-hidden="true" className="h-4 w-4 text-mint" />
      Generate
    </button>
  );
}
