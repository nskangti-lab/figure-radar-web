export const ADMIN_AUTH_COOKIE = "figure_radar_admin_auth";

export function adminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export async function adminAuthToken(password = adminPassword()) {
  const input = new TextEncoder().encode(`figure-radar-admin:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", input);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function safeAdminNext(value: unknown) {
  const next = typeof value === "string" ? value.trim() : "";

  if (next.startsWith("/admin") && !next.startsWith("/admin/login")) {
    return next;
  }

  return "/admin";
}
