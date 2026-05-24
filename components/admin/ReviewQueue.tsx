import { Save } from "lucide-react";
import { EnvNotice } from "@/components/EnvNotice";
import { updateReviewStatus } from "@/lib/admin/actions";
import { getAdminRows } from "@/lib/admin/data";
import { asDisplay, asString } from "@/lib/format";

export async function ReviewQueue() {
  const result = await getAdminRows("admin_review_queue", 100);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-coral">Admin</p>
        <h1 className="text-2xl font-black text-ink">Review Queue</h1>
      </div>
      {!result.configured ? <EnvNotice kind="service" /> : null}
      {result.rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-neutral-500">
          검토 대기 항목이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {result.rows.map((row, index) => (
            <article
              key={asString(row.id) || index}
              className="rounded-lg border border-line bg-white p-4"
            >
              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-ink">
                    {asDisplay(row.source_table || row.entity_type || row.id)}
                  </p>
                  <p className="text-neutral-600">
                    source_id {asDisplay(row.source_id || row.entity_id)}
                  </p>
                  <p className="text-neutral-600">status {asDisplay(row.review_status)}</p>
                </div>
                <form action={updateReviewStatus} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={asString(row.id)} />
                  <select
                    name="review_status"
                    defaultValue={asString(row.review_status, "pending")}
                    className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-mint"
                  >
                    <option value="pending">pending</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                    <option value="needs_review">needs_review</option>
                  </select>
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-coral"
                  >
                    <Save aria-hidden="true" className="h-4 w-4" />
                    저장
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
