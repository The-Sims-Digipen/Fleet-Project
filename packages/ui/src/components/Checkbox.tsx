import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ComponentPropsWithoutRef,
} from "react";

export type CheckboxProps = Omit<ComponentPropsWithoutRef<"input">, "type"> & {
  label: string;
  helperText?: string;
  error?: string;
  indeterminate?: boolean;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, helperText, error, indeterminate = false, className, id: idProp, disabled, ...props },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const descId = `${id}-desc`;
  const hasError = Boolean(error);

  const innerRef = useRef<HTMLInputElement>(null);

  // Merge the forwarded ref with our local ref so we can drive the
  // `indeterminate` DOM property, which has no HTML attribute equivalent.
  const setRefs = (node: HTMLInputElement | null) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div className="grid gap-1">
      <label
        htmlFor={id}
        className={[
          "flex cursor-pointer items-start gap-2.5",
          disabled && "cursor-not-allowed opacity-50",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="relative mt-0.5 inline-flex size-[18px] shrink-0">
          <input
            ref={setRefs}
            type="checkbox"
            id={id}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={helperText || error ? descId : undefined}
            className={[
              "peer size-full cursor-pointer appearance-none rounded-[4px] border-2 bg-chargedup-white transition-[background-color,border-color] duration-150",
              "checked:border-chargedup-blue checked:bg-chargedup-blue",
              "indeterminate:border-chargedup-blue indeterminate:bg-chargedup-blue",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chargedup-blue focus-visible:ring-offset-2",
              hasError
                ? "border-status-danger"
                : "border-chargedup-night/30 hover:border-chargedup-blue",
              disabled && "cursor-not-allowed",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
          {/* Tick — shown only when the input is checked (works controlled or uncontrolled). */}
          <svg
            viewBox="0 0 14 14"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 m-auto hidden size-3 text-chargedup-white peer-checked:block peer-indeterminate:hidden"
          >
            <path
              d="M2.5 7l3.5 3.5 5.5-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          {/* Dash — shown only in the indeterminate state. */}
          <svg
            viewBox="0 0 14 14"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 m-auto hidden size-3 text-chargedup-white peer-indeterminate:block"
          >
            <path d="M3 7h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <span className="font-body text-sm leading-[1.4] text-chargedup-night">{label}</span>
      </label>

      {(error || helperText) && (
        <p
          id={descId}
          className={`ml-[26px] font-body text-xs ${error ? "text-status-danger" : "text-chargedup-night/55"}`}
          role={error ? "alert" : undefined}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
});
