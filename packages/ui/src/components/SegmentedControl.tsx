import type { ReactNode } from "react";

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: ReactNode;
  /** Optional accessible label when `label` is an icon or otherwise not descriptive. */
  ariaLabel?: string;
  disabled?: boolean;
};

export type SegmentedControlProps<T extends string> = {
  /** Currently selected value. */
  value: T;
  /** The mutually-exclusive options rendered as a single selector. */
  options: SegmentedControlOption<T>[];
  /** Called with the newly selected value. */
  onChange: (value: T) => void;
  /** Accessible group label, applied as aria-label on the group container. */
  label?: string;
  className?: string;
};

/**
 * SegmentedControl — a row of mutually-exclusive options rendered as a single
 * selector. Each option is a button exposing its state via `aria-pressed`,
 * matching the toggle semantics used across the product toolbars.
 */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={[
        "inline-flex items-center gap-1 rounded-[8px] border border-chargedup-night/15 bg-chargedup-night/5 p-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            aria-label={option.ariaLabel}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={[
              "min-h-8 rounded-[5px] px-3 font-body text-sm font-semibold transition-colors duration-150",
              "text-chargedup-night/65 hover:text-chargedup-night",
              "aria-pressed:bg-chargedup-white aria-pressed:text-chargedup-night aria-pressed:shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chargedup-blue focus-visible:ring-inset",
              "disabled:cursor-not-allowed disabled:opacity-45",
              "motion-reduce:transition-none",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
