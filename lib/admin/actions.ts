"use server";

import { revalidatePath } from "next/cache";
import { getAdminEntity } from "@/lib/admin/config";
import { getServiceSupabase } from "@/lib/supabase/server";

export type AdminActionState = {
  ok: boolean;
  message: string;
};

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function parseFieldValue(type: string | undefined, raw: string) {
  if (!raw) {
    return null;
  }

  if (type === "number") {
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  return raw;
}

function fieldValue(formData: FormData, fieldName: string) {
  return stringValue(formData.get(fieldName));
}

function asDefaultString(value: string | boolean | undefined) {
  if (value === undefined) {
    return "";
  }

  return String(value);
}

function missingRequiredField(formData: FormData, fieldName: string, type: string | undefined) {
  if (type === "checkbox") {
    return !formData.has(fieldName);
  }

  return !fieldValue(formData, fieldName);
}

export async function saveAdminRecord(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const entityKey = stringValue(formData.get("_entity"));
  const config = getAdminEntity(entityKey);
  const supabase = getServiceSupabase();

  if (!config) {
    return { ok: false, message: "Unknown admin entity." };
  }

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase service role environment variables are not configured."
    };
  }

  const id = stringValue(formData.get("id"));
  const payload: Record<string, unknown> = {};

  for (const field of config.fields) {
    const hasSubmittedValue = formData.has(field.name);

    if (field.required && missingRequiredField(formData, field.name, field.type)) {
      return { ok: false, message: `${field.label} is required.` };
    }

    if (field.type === "checkbox") {
      payload[field.name] = formData.has(field.name);
      continue;
    }

    const raw = hasSubmittedValue ? fieldValue(formData, field.name) : asDefaultString(field.defaultValue);
    payload[field.name] = parseFieldValue(field.type, raw);
  }

  const response = id
    ? await supabase.from(config.table).update(payload).eq("id", id)
    : await supabase.from(config.table).insert(payload);

  if (response.error) {
    return { ok: false, message: response.error.message };
  }

  revalidatePath(config.path);
  revalidatePath("/admin");

  return { ok: true, message: "Saved." };
}

export async function deleteAdminRecord(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const entityKey = stringValue(formData.get("_entity"));
  const id = stringValue(formData.get("id"));
  const config = getAdminEntity(entityKey);
  const supabase = getServiceSupabase();

  if (!config) {
    return { ok: false, message: "Unknown admin entity." };
  }

  if (entityKey !== "aliases") {
    return { ok: false, message: "Delete is only available for aliases." };
  }

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase service role environment variables are not configured."
    };
  }

  if (!id) {
    return { ok: false, message: "id is required." };
  }

  const response = await supabase.from(config.table).delete().eq("id", id);
  if (response.error) {
    return { ok: false, message: response.error.message };
  }

  revalidatePath(config.path);
  revalidatePath("/admin");

  return { ok: true, message: "Deleted." };
}

export async function updateReviewStatus(formData: FormData) {
  const supabase = getServiceSupabase();
  const config = getAdminEntity("admin_review_queue");

  if (!supabase || !config) {
    throw new Error("Supabase service role environment variables are not configured.");
  }

  const id = stringValue(formData.get("id"));
  const reviewStatus = stringValue(formData.get("review_status"));

  if (!id || !reviewStatus) {
    throw new Error("id and review_status are required.");
  }

  const { error } = await supabase
    .from(config.table)
    .update({ review_status: reviewStatus })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(config.path);
  revalidatePath("/admin");
}
