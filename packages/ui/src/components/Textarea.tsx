import { forwardRef, useId, type ComponentPropsWithoutRef } from "react";

export type TextareaProps = ComponentPropsWithoutRef<"textarea"> & {
  label: string;
  helperText?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, helperText, error, className, id: idProp, disabled, ...props },
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

      <textarea
        ref={ref}
        id={id}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={helperText || error ? descId : undefined}
        className={[
          "min-h-[100px] w-full resize-y rounded-[6px] border bg-chargedup-white px-3 py-2.5 font-body text-sm text-chargedup-night placeholder:text-chargedup-night/35 transition-[border-color,box-shadow] duration-150 focus:outline-none",
          hasError
            ? "border-status-danger ring-1 ring-status-danger/30"
            : "border-chargedup-night/20 focus:border-chargedup-blue focus:ring-2 focus:ring-chargedup-blue/20",
          disabled && "cursor-not-allowed opacity-50",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />

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
