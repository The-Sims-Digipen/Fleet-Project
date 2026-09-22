import type { ReactNode } from "react";

export type PropsRow = {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
};

export function PropsTable({ rows }: { rows: PropsRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left font-body text-sm">
        <thead>
          <tr>
            {["Prop", "Type", "Default", "Description"].map((h) => (
              <th
                key={h}
                className="border-b border-chargedup-night/10 pb-3 pr-6 font-heading text-xs font-bold uppercase tracking-[0.12em] text-chargedup-night/50 first:pl-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="group">
              <td className="py-3 pr-6 align-top">
                <code className="rounded-[4px] bg-chargedup-blue/8 px-1.5 py-0.5 font-mono text-xs font-semibold text-chargedup-blue">
                  {row.name}
                  {row.required && <span className="ml-0.5 text-status-danger">*</span>}
                </code>
              </td>
              <td className="py-3 pr-6 align-top">
                <code className="rounded-[4px] bg-chargedup-night/5 px-1.5 py-0.5 font-mono text-xs text-chargedup-night/70">
                  {row.type}
                </code>
              </td>
              <td className="py-3 pr-6 align-top">
                {row.default ? (
                  <code className="rounded-[4px] bg-chargedup-night/5 px-1.5 py-0.5 font-mono text-xs text-chargedup-night/60">
                    {row.default}
                  </code>
                ) : (
                  <span className="text-chargedup-night/30">—</span>
                )}
              </td>
              <td className="py-3 align-top leading-relaxed text-chargedup-night/70">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RequiredNote() {
  return (
    <p className="mt-2 font-body text-xs text-chargedup-night/40">
      <span className="text-status-danger">*</span> Required prop
    </p>
  );
}

// A simple required-with-note wrapper
export function PropsMeta({ rows, note }: { rows: PropsRow[]; note?: ReactNode }) {
  const hasRequired = rows.some((r) => r.required);
  return (
    <>
      <PropsTable rows={rows} />
      {hasRequired && <RequiredNote />}
      {note && <p className="mt-2 font-body text-xs text-chargedup-night/50">{note}</p>}
    </>
  );
}
