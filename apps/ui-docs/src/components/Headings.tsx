import type { ReactNode } from "react";

/** Page-level heading with divider and optional description */
export function PageHeading({
  title,
  description,
  badge,
}: {
  title: string;
  description?: string;
  badge?: ReactNode;
}) {
  return (
    <div className="mb-8 border-b border-chargedup-night/10 pb-8">
      <div className="mb-3 flex items-center gap-3">
        <h1 className="font-heading text-3xl font-bold text-chargedup-night">{title}</h1>
        {badge}
      </div>
      {description && (
        <p className="max-w-2xl font-body text-base leading-relaxed text-chargedup-night/60">
          {description}
        </p>
      )}
    </div>
  );
}

/** Section heading within a page */
export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-5 font-heading text-xl font-bold text-chargedup-night">{children}</h2>
  );
}

/** Import code snippet banner */
export function ImportBanner({ importStr }: { importStr: string }) {
  return (
    <div className="mb-8 flex items-center gap-3 rounded-[8px] border border-chargedup-blue/20 bg-chargedup-blue/5 px-4 py-3">
      <span className="shrink-0 font-mono text-xs font-bold uppercase tracking-wider text-chargedup-blue">
        Import
      </span>
      <code className="font-mono text-sm text-chargedup-night/80">{importStr}</code>
    </div>
  );
}
