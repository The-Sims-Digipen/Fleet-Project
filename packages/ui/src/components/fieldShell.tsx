import type { ReactNode } from "react";

/** Shared label + description + error chrome used by the *Field components. */
export type FieldShellProps = {
  id: string;
  label: string;
  /** Supporting hint shown below when there is no error. */
  helperText?: string;
  /** Error message shown below with the alert role. */
  error?: string;
  descId: string;
  children: ReactNode;
  className?: string;
};

/**
 * Internal layout shell shared by TextField, NumberField, and ColorField.
 * Not exported from the package: the concrete fields compose it.
 */
export function FieldShell({ id, label, helperText, error, descId, children, className }: FieldShellProps) {
  return (
    <div className={["grid min-w-0 gap-1.5", className].filter(Boolean).join(" ")}>
      <label
        htmlFor={id}
        className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-chargedup-night/70"
      >
        {label}
      </label>
      {children}
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
}

/** The shared control-surface classes for text-like field inputs. */
export function fieldInputClasses(hasError: boolean, extra?: string): string {
  return [
    "min-h-11 w-full min-w-0 rounded-[6px] border bg-chargedup-white px-3 py-2 font-body text-sm text-chargedup-night placeholder:text-chargedup-night/35 transition-[border-color,box-shadow] duration-150 focus:outline-none",
    hasError
      ? "border-status-danger ring-1 ring-status-danger/30"
      : "border-chargedup-night/20 focus:border-chargedup-blue focus:ring-2 focus:ring-chargedup-blue/20",
    "disabled:cursor-not-allowed disabled:opacity-50",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}
