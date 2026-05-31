"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_AUTH_COOKIE,
  adminAuthToken,
  adminPassword,
  isProduction,
  safeAdminNext
} from "@/lib/admin/auth";

export type AdminLoginState = {
  ok: boolean;
  message: string;
};

export async function loginAdmin(
  _previousState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const configuredPassword = adminPassword();
  if (!configuredPassword) {
    return {
      ok: false,
      message: isProduction()
        ? "ADMIN_PASSWORD is not configured. Admin access is blocked."
        : "ADMIN_PASSWORD is not configured. Set it in .env.local to enable admin login."
    };
  }

  const password = String(formData.get("password") ?? "");
  if (password !== configuredPassword) {
    return {
      ok: false,
      message: "Password is incorrect."
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_AUTH_COOKIE, await adminAuthToken(configuredPassword), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/admin",
    maxAge: 60 * 60 * 12
  });

  redirect(safeAdminNext(formData.get("next")));
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_AUTH_COOKIE);
  redirect("/admin/login");
}
