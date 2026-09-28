import { useId, useState } from "react";
import { type EditLifecycle, runEdit } from "./editLifecycle";
import { FieldShell, fieldInputClasses } from "./fieldShell";

export type NumberFieldProps = {
  label: string;
  /** Committed numeric value. */
  value: number;
  /** Called with the parsed number once the input is valid. */
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  /** Optional begin/commit/cancel hooks for an undo/history boundary. */
  edit?: EditLifecycle;
  className?: string;
};

/** Round to a stable string so the input does not show float noise while idle. */
function display(value: number): string {
  return String(Number(value.toFixed(4)));
}

/**
 * NumberField — a numeric input with an edit lifecycle.
 *
 * Keeps a draft while focused so partially typed values (like "-" or "1.")
 * are not clobbered; commits on blur or Enter and cancels on Escape. `onChange`
 * fires only when the draft parses to a finite number within `min`/`max`.
 */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  helperText,
  error,
  disabled,
  id: idProp,
  edit,
  className,
}: NumberFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const descId = `${id}-desc`;
  const [draft, setDraft] = useState<string | null>(null);
  const hasError = Boolean(error);

  return (
    <FieldShell id={id} label={label} helperText={helperText} error={error} descId={descId} className={className}>
      <input
        id={id}
        type="number"
        value={draft ?? display(value)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={helperText || error ? descId : undefined}
        className={fieldInputClasses(hasError, "cursor-text tabular-nums")}
        onFocus={() => {
          runEdit(edit, "beginEdit");
          setDraft(display(value));
        }}
        onChange={(event) => {
          const text = event.target.value;
          setDraft(text);
          const parsed = Number(text);
          const valid =
            text.trim() !== "" &&
            Number.isFinite(parsed) &&
            (min === undefined || parsed >= min) &&
            (max === undefined || parsed <= max);
          if (valid) {
            runEdit(edit, "beginEdit");
            onChange(parsed);
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
    </FieldShell>
  );
}
