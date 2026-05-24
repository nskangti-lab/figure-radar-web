"use client";

import { useActionState, useState } from "react";
import type { ChangeEvent } from "react";
import { Save } from "lucide-react";
import { ProductGroupNameButton } from "@/components/admin/ProductGroupNameButton";
import { saveAdminRecord, type AdminActionState } from "@/lib/admin/actions";
import type { AdminEntityConfig, AdminEntityKey, AdminField } from "@/lib/admin/config";
import { asString } from "@/lib/format";
import type { AdminOption, AnyRecord } from "@/lib/types";

type AdminRecordFormProps = {
  config: AdminEntityConfig;
  entityKey: AdminEntityKey;
  mode: "create" | "edit";
  record: AnyRecord;
  optionsByField: Record<string, AdminOption[]>;
};

type FormValues = Record<string, string | boolean>;

const initialState: AdminActionState = {
  ok: false,
  message: ""
};

function initialFormValues(config: AdminEntityConfig, record: AnyRecord) {
  return config.fields.reduce<FormValues>((values, field) => {
    const savedValue = record[field.name];
    const value = savedValue === undefined || savedValue === null ? field.defaultValue : savedValue;

    values[field.name] =
      field.type === "checkbox"
        ? value === true || value === "true"
        : asString(value);
    return values;
  }, {});
}

export function AdminRecordForm({
  config,
  entityKey,
  mode,
  record,
  optionsByField
}: AdminRecordFormProps) {
  const [state, formAction, isPending] = useActionState(saveAdminRecord, initialState);
  const [values, setValues] = useState<FormValues>(() => initialFormValues(config, record));
  const formId = `${entityKey}-${mode}-${asString(record.id) || "new"}`.replace(
    /[^a-zA-Z0-9_-]/g,
    "-"
  );

  function setFieldValue(name: string, value: string | boolean) {
    setValues((current) => ({
      ...current,
      [name]: value
    }));
  }

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="_entity" value={entityKey} />
      {mode === "edit" ? <input type="hidden" name="id" value={asString(record.id)} /> : null}

      {state.message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm md:col-span-2 ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      {config.fields.map((field) => (
        <FieldInput
          key={field.name}
          entityKey={entityKey}
          formId={formId}
          field={field}
          value={values[field.name]}
          onValueChange={setFieldValue}
          options={optionsByField[field.name] ?? []}
        />
      ))}

      <div className="flex items-end md:col-span-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-coral disabled:cursor-wait disabled:opacity-70"
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {isPending ? "Saving..." : mode === "edit" ? "Save changes" : "Create"}
        </button>
      </div>
    </form>
  );
}

function FieldInput({
  entityKey,
  formId,
  field,
  value,
  onValueChange,
  options
}: {
  entityKey: AdminEntityKey;
  formId: string;
  field: AdminField;
  value: string | boolean | undefined;
  onValueChange: (name: string, value: string | boolean) => void;
  options: AdminOption[];
}) {
  const id = `${formId}-${field.name}`;
  const inputClass =
    "h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-mint";
  const stringValue = typeof value === "string" ? value : "";

  function handleTextChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    onValueChange(field.name, event.target.value);
  }

  return (
    <label
      className={
        field.type === "textarea" || field.type === "checkbox"
          ? "grid gap-1 md:col-span-2"
          : "grid gap-1"
      }
    >
      <span className="text-sm font-semibold text-neutral-700">
        {field.label}
        {field.required ? <span className="text-coral"> *</span> : null}
      </span>
      <div className="flex gap-2">
        {field.type === "checkbox" ? (
          <input
            id={id}
            name={field.name}
            type="checkbox"
            required={field.required}
            checked={value === true}
            onChange={(event) => onValueChange(field.name, event.target.checked)}
            className="h-5 w-5 rounded border-line text-mint focus:ring-mint"
          />
        ) : field.type === "select" ? (
          <select
            id={id}
            name={field.name}
            value={stringValue}
            onChange={handleTextChange}
            required={field.required}
            className={inputClass}
          >
            <option value="">Not selected</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === "textarea" ? (
          <textarea
            id={id}
            name={field.name}
            value={stringValue}
            onChange={handleTextChange}
            required={field.required}
            placeholder={field.placeholder}
            className="min-h-24 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-mint"
          />
        ) : (
          <input
            id={id}
            name={field.name}
            type={field.type ?? "text"}
            value={stringValue}
            onChange={handleTextChange}
            required={field.required}
            placeholder={field.placeholder}
            className={inputClass}
          />
        )}
        {entityKey === "product_groups" && field.name === "display_name_kr" ? (
          <ProductGroupNameButton
            formId={formId}
            onGenerated={(generatedValue) => onValueChange(field.name, generatedValue)}
          />
        ) : null}
      </div>
    </label>
  );
}
