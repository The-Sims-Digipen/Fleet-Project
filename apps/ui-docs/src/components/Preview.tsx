import { useState, type ReactNode } from "react";

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

/**
 * A preview surface with a light/dark toggle. Applies the `.dark` class to the
 * surface so the library's semantic tokens resolve to their dark values, letting
 * you see theme-aware components in both themes. Uses `bg-surface`/`text-ink`
 * from the library so the surface itself follows the active theme.
 */
export function ThemedPreview({ children, className }: { children: ReactNode; className?: string }) {
  const [dark, setDark] = useState(false);
  return (
    <div className="min-w-0 w-full">
      <div className="mb-2 flex items-center justify-end">
        <button
          type="button"
          aria-pressed={dark}
          onClick={() => setDark((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-chargedup-night/15 bg-chargedup-white px-3 py-1 font-body text-xs font-semibold text-chargedup-night/70 hover:text-chargedup-night"
        >
          <span aria-hidden="true">{dark ? "🌙" : "☀️"}</span>
          {dark ? "Dark" : "Light"}
        </button>
      </div>
      <div
        className={[
          dark ? "dark" : "",
          "flex min-h-[80px] min-w-0 w-full flex-wrap items-start gap-4 overflow-x-hidden rounded-[8px] border border-ink/10 bg-surface p-6 text-ink shadow-sm",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
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
