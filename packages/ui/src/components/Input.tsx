import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from "react";

export type InputProps = ComponentPropsWithoutRef<"input"> & {
  label: string;
  helperText?: string;
  error?: string;
  leadingAdornment?: ReactNode;
  trailingAdornment?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helperText, error, leadingAdornment, trailingAdornment, className, id: idProp, disabled, ...props },
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

      <div
        className={[
          "flex min-h-11 items-center gap-2 rounded-[6px] border bg-chargedup-white px-3 py-2 transition-[border-color,box-shadow] duration-150",
          hasError
            ? "border-status-danger ring-1 ring-status-danger/30"
            : "border-chargedup-night/20 focus-within:border-chargedup-blue focus-within:ring-2 focus-within:ring-chargedup-blue/20",
          disabled && "cursor-not-allowed opacity-50",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {leadingAdornment && (
          <span className="shrink-0 text-chargedup-night/45" aria-hidden="true">
            {leadingAdornment}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={helperText || error ? descId : undefined}
          className={[
            "min-w-0 flex-1 bg-transparent font-body text-sm text-chargedup-night placeholder:text-chargedup-night/35 focus:outline-none disabled:cursor-not-allowed",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {trailingAdornment && (
          <span className="shrink-0 text-chargedup-night/45" aria-hidden="true">
            {trailingAdornment}
          </span>
        )}
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
