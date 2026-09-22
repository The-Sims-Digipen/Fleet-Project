import { useState, type ReactNode } from "react";
import { CodeBlock } from "./CodeBlock";
import { PropsTable, type PropsRow } from "./PropsTable";

export type ComponentSectionProps = {
  title: string;
  description?: string;
  preview: ReactNode;
  code: string;
  props?: PropsRow[];
  id?: string;
};

/**
 * Full documentation section for a single component example.
 * Shows: title, description, live preview, tabbed Code/Props panel.
 */
export function ComponentSection({ title, description, preview, code, props, id }: ComponentSectionProps) {
  const [tab, setTab] = useState<"code" | "props">("code");

  return (
    <section id={id} className="scroll-mt-24 min-w-0 w-full">
      <h3 className="mb-1 font-heading text-base font-bold text-chargedup-night">{title}</h3>
      {description && (
        <p className="mb-4 font-body text-sm leading-relaxed text-chargedup-night/60">{description}</p>
      )}
      <div className="mb-2 min-w-0 w-full overflow-hidden">{preview}</div>

      {/* Tabs */}
      <div className="mt-3 min-w-0 w-full overflow-hidden rounded-[8px]">
        <div className="flex border-b border-chargedup-night/10 bg-chargedup-white px-1 pt-1">
          {(["code", ...(props ? ["props"] : [])] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t as "code" | "props")}
              className={[
                "rounded-t px-3 py-2 font-body text-xs font-semibold capitalize transition-colors",
                tab === t
                  ? "border-b-2 border-chargedup-blue text-chargedup-blue"
                  : "text-chargedup-night/45 hover:text-chargedup-night/70",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="min-w-0 w-full overflow-hidden">
          {tab === "code" && <CodeBlock code={code} />}
          {tab === "props" && props && (
            <div className="overflow-x-auto rounded-b-[8px] border border-t-0 border-chargedup-night/10 bg-chargedup-white p-5">
              <PropsTable rows={props} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
