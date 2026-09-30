import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type StatCardDensity = "kpi" | "compact";

export type StatCardProps = ComponentPropsWithoutRef<"div"> & {
  /** Short uppercase label describing the metric (e.g. "Total cost"). */
  label: ReactNode;
  /** The primary value. Rendered large for `kpi`, mono for `compact`. */
  value: ReactNode;
  /** Optional supporting caption shown beneath the value. */
  caption?: ReactNode;
  /**
   * Visual density.
   * - `kpi` (default): a bordered card with a big number — for dashboards.
   * - `compact`: a single label/value row — for dense metric lists.
   */
  density?: StatCardDensity;
};

/**
 * StatCard — a labelled metric tile.
 *
 * Two densities cover the recurring shapes in the product: big-number KPI cards
 * on summary dashboards, and compact label/value rows inside denser panels.
 */
export function StatCard({
  label,
  value,
  caption,
  density = "kpi",
  className,
  ...props
}: StatCardProps) {
  if (density === "compact") {
    return (
      <div
        className={[
          "flex items-baseline justify-between gap-3 py-1",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        <span className="font-body text-sm text-chargedup-night/65">{label}</span>
        <span className="text-right font-body text-sm font-semibold tabular-nums text-chargedup-night">
          {value}
        </span>
        {caption != null && (
          <span className="font-body text-xs text-chargedup-night/50">{caption}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={[
        "rounded-[10px] border border-chargedup-night/10 bg-chargedup-white p-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <p className="font-body text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-chargedup-night/55">
        {label}
      </p>
      <p className="mt-1.5 font-heading text-2xl font-bold tabular-nums text-chargedup-night">
        {value}
      </p>
      {caption != null && (
        <p className="mt-1 font-body text-xs text-chargedup-night/55">{caption}</p>
      )}
    </div>
  );
}
