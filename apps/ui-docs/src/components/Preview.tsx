import type { ReactNode } from "react";

/** White surface for showcasing light-mode components */
export function LivePreview({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={[
        "flex min-h-[80px] min-w-0 w-full flex-wrap items-start gap-4 overflow-x-hidden rounded-[8px] border border-chargedup-night/10 bg-chargedup-white p-6 shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

/** Night Blue surface for showcasing dark-surface component variants */
export function DarkPreview({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={[
        "flex min-h-[80px] min-w-0 w-full flex-wrap items-start gap-4 overflow-x-hidden rounded-[8px] border border-chargedup-white/10 bg-chargedup-night p-6 shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

/** Grey app background — closest to the actual UI-showcase surface */
export function AppPreview({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={[
        "min-w-0 w-full overflow-x-hidden rounded-[8px] border border-chargedup-night/10 p-6",
        "bg-[#f5f5f7]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
