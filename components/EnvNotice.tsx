type EnvNoticeProps = {
  kind?: "public" | "service";
};

export function EnvNotice({ kind = "public" }: EnvNoticeProps) {
  const keys =
    kind === "service"
      ? "NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
      : "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY";

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      Supabase 환경변수가 아직 비어 있습니다. <code>.env.local</code>에 {keys}를
      설정하면 데이터가 표시됩니다.
    </div>
  );
}
