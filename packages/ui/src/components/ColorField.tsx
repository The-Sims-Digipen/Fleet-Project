import { useId, useState } from "react";
import { type EditLifecycle, runEdit } from "./editLifecycle";
import { FieldShell } from "./fieldShell";

export type ColorFieldProps = {
  label: string;
  /** Committed colour as a `#rrggbb` hex string. */
  value: string;
  /** Called with the new `#rrggbb` value once it is valid. */
  onChange: (value: string) => void;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  /** Optional begin/commit/cancel hooks for an undo/history boundary. */
  edit?: EditLifecycle;
  className?: string;
};

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * ColorField — a native colour swatch paired with an editable hex input.
 *
 * The swatch commits immediately on pick; the hex text field keeps a draft and
 * commits only when it matches `#rrggbb`, restoring the previous value on
 * Escape. Both share one edit lifecycle so a pick-then-type sequence brackets a
 * single edit.
 */
export function ColorField({
  label,
  value,
  onChange,
  helperText,
  error,
  disabled,
  id: idProp,
  edit,
  className,
}: ColorFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const descId = `${id}-desc`;
  const [draft, setDraft] = useState<string | null>(null);
  const hasError = Boolean(error);

  return (
    <FieldShell id={id} label={label} helperText={helperText} error={error} descId={descId} className={className}>
      <div
        className={[
          "flex min-h-11 w-full min-w-0 items-center gap-2.5 overflow-hidden rounded-[6px] border bg-chargedup-white px-3 transition-[border-color,box-shadow] duration-150",
          hasError
            ? "border-status-danger ring-1 ring-status-danger/30"
            : "border-chargedup-night/20 focus-within:border-chargedup-blue focus-within:ring-2 focus-within:ring-chargedup-blue/20",
          disabled && "cursor-not-allowed opacity-50",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          id={id}
          type="color"
          aria-label={label}
          value={value}
          disabled={disabled}
          className="size-[26px] shrink-0 cursor-pointer appearance-none rounded-[4px] border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-[4px] [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-[4px] [&::-moz-color-swatch]:border-0"
          onFocus={() => runEdit(edit, "beginEdit")}
          onBlur={() => runEdit(edit, "commitEdit")}
          onChange={(event) => {
            runEdit(edit, "beginEdit");
            onChange(event.target.value);
          }}
        />
        <input
          type="text"
          aria-label={`${label} hex value`}
          aria-invalid={hasError || undefined}
          aria-describedby={helperText || error ? descId : undefined}
          value={draft ?? value.toUpperCase()}
          maxLength={7}
          spellCheck={false}
          disabled={disabled}
          className="h-9 min-w-0 flex-1 cursor-text border-0 bg-transparent p-0 font-mono text-sm text-chargedup-night focus:outline-none"
          onFocus={() => {
            runEdit(edit, "beginEdit");
            setDraft(value);
          }}
          onChange={(event) => {
            const text = event.target.value;
            setDraft(text);
            if (HEX.test(text)) {
              runEdit(edit, "beginEdit");
              onChange(text);
            }
          }}
          onBlur={() => {
            runEdit(edit, "commitEdit");
            setDraft(null);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== "Escape") return;
            event.preventDefault();
            if (event.key === "Escape") runEdit(edit, "cancelEdit");
            else runEdit(edit, "commitEdit");
            setDraft(null);
            event.currentTarget.blur();
          }}
        />
      </div>
    </FieldShell>
  );
}
