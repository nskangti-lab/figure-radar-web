import { EnvNotice } from "@/components/EnvNotice";
import { AdminRecordForm } from "@/components/admin/AdminRecordForm";
import { getAdminEntity, type AdminEntityKey } from "@/lib/admin/config";
import { getAdminRows } from "@/lib/admin/data";
import { asDisplay, asString, relationName } from "@/lib/format";
import type { AdminOption, AnyRecord } from "@/lib/types";

type AdminEntityPageProps = {
  entityKey: AdminEntityKey;
  optionsByField?: Record<string, AdminOption[]>;
};

export async function AdminEntityPage({
  entityKey,
  optionsByField = {}
}: AdminEntityPageProps) {
  const config = getAdminEntity(entityKey);
  const result = await getAdminRows(entityKey);

  if (!config) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-coral">Admin</p>
        <h1 className="text-2xl font-black text-ink">{config.title}</h1>
      </div>

      {!result.configured ? <EnvNotice kind="service" /> : null}
      {result.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {result.error}
        </div>
      ) : null}

      <section className="rounded-lg border border-line bg-white p-4">
        <h2 className="mb-4 font-bold text-ink">Create</h2>
        <AdminRecordForm
          config={config}
          entityKey={entityKey}
          mode="create"
          record={{}}
          optionsByField={optionsByField}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-ink">List</h2>
        {result.rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-neutral-500">
            No records.
          </div>
        ) : (
          <div className="space-y-3">
            {result.rows.map((row, index) => (
              <details
                key={asString(row.id) || index}
                className="rounded-lg border border-line bg-white p-4"
              >
                <summary className="cursor-pointer list-none">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink">
                          {recordTitle(row, config.titleFields)}
                        </p>
                        {asString(row.id).trim() ? (
                          <p className="mt-0.5 font-mono text-xs text-neutral-400">
                            {shortId(row.id)}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-mint">Edit</span>
                    </div>
                    <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {config.listColumns.map((column) => (
                        <div key={column} className="min-w-0 rounded-md bg-paper px-3 py-2">
                          <dt className="text-xs font-semibold text-neutral-500">{column}</dt>
                          <dd className="mt-1 truncate text-sm text-neutral-700">
                            {displayColumnValue(row, column)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </summary>
                <div className="mt-4 border-t border-line pt-4">
                  <AdminRecordForm
                    config={config}
                    entityKey={entityKey}
                    mode="edit"
                    record={row}
                    optionsByField={optionsByField}
                  />
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function recordTitle(row: AnyRecord, titleFields: string[]) {
  for (const field of titleFields) {
    const value = asString(row[field]).trim();
    if (value) {
      if (field === "id") {
        return shortId(value);
      }

      return value;
    }
  }

  return shortId(row.id);
}

function shortId(value: unknown) {
  const id = asString(value).trim();
  return id ? id.slice(0, 8) : "-";
}

function displayColumnValue(row: AnyRecord, column: string) {
  if (column === "shop") {
    return asDisplay(relationName(row.shops, ["name", "slug"]));
  }

  return asDisplay(row[column]);
}
