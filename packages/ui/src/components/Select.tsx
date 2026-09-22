import { forwardRef, useId, type ComponentPropsWithoutRef } from "react";

export type SelectProps = ComponentPropsWithoutRef<"select"> & {
  label: string;
  helperText?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, helperText, error, className, id: idProp, disabled, children, ...props },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const descId = `${id}-desc`;
  const hasError = Boolean(error);

  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={id}
        className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-chargedup-night/70"
      >
        {label}
      </label>

      <div className="relative">
        <select
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={helperText || error ? descId : undefined}
          className={[
            "w-full min-h-11 appearance-none rounded-[6px] border bg-chargedup-white px-3 py-2 pr-9 font-body text-sm text-chargedup-night transition-[border-color,box-shadow] duration-150 focus:outline-none",
            hasError
              ? "border-status-danger ring-1 ring-status-danger/30"
              : "border-chargedup-night/20 focus:border-chargedup-blue focus:ring-2 focus:ring-chargedup-blue/20",
            disabled && "cursor-not-allowed opacity-50",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          {children}
        </select>
        {/* Chevron icon */}
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-chargedup-night/45"
          aria-hidden="true"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      {(error || helperText) && (
        <p
          id={descId}
          className={`font-body text-xs ${error ? "text-status-danger" : "text-chargedup-night/55"}`}
          role={error ? "alert" : undefined}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
});
