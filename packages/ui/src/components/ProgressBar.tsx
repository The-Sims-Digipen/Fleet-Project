import { type ReactNode } from "react";

export type ProgressBarTone = "accent" | "success" | "warning" | "danger";

export type ProgressBarProps = {
  /** Current value. */
  value: number;
  /** Maximum value the bar fills to. Defaults to 100. */
  max?: number;
  /** Optional label shown above the track. */
  label?: ReactNode;
  /** Optional value readout shown opposite the label. */
  valueLabel?: ReactNode;
  /** Fill colour tone. */
  tone?: ProgressBarTone;
  className?: string;
};

const toneFill: Record<ProgressBarTone, string> = {
  accent: "bg-chargedup-blue",
  success: "bg-status-success",
  warning: "bg-status-warning",
  danger: "bg-status-danger",
};

/**
 * ProgressBar — a labelled horizontal meter.
 *
 * Renders an optional label/value header over a rounded track whose fill is
 * clamped to the [0, max] range and exposed to assistive tech via the
 * `progressbar` role and aria-value* attributes.
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  valueLabel,
  tone = "accent",
  className,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const pct = max > 0 ? (clamped / max) * 100 : 0;

  return (
    <div className={["grid gap-1.5", className].filter(Boolean).join(" ")}>
      {(label != null || valueLabel != null) && (
        <div className="flex items-center justify-between gap-3 font-body text-xs">
          {label != null ? (
            <span className="text-chargedup-night/65">{label}</span>
          ) : (
            <span />
          )}
          {valueLabel != null && (
            <span className="tabular-nums text-chargedup-night">{valueLabel}</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-2 overflow-hidden rounded-full bg-chargedup-night/10"
      >
        <div
          className={["h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none", toneFill[tone]].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
