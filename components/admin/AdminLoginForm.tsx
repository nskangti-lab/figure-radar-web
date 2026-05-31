"use client";

import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { loginAdmin, type AdminLoginState } from "@/lib/admin/auth-actions";

type AdminLoginFormProps = {
  nextPath: string;
};

const initialState: AdminLoginState = {
  ok: false,
  message: ""
};

export function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="next" value={nextPath} />
      {state.message ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {state.message}
        </div>
      ) : null}
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-neutral-700">Admin password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 rounded-md border border-line bg-white px-3 outline-none focus:border-mint"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-semibold text-white transition hover:bg-coral disabled:cursor-wait disabled:opacity-70"
      >
        <LockKeyhole aria-hidden="true" className="h-4 w-4" />
        {isPending ? "Checking..." : "Log in"}
      </button>
    </form>
  );
}
