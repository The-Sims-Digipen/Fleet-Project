import { useId, useState } from "react";
import { type EditLifecycle, runEdit } from "./editLifecycle";
import { FieldShell, fieldInputClasses } from "./fieldShell";

export type TextFieldProps = {
  label: string;
  /** Committed value. */
  value: string;
  /** Called with the new value once it is valid (non-empty after trimming). */
  onChange: (value: string) => void;
  helperText?: string;
  error?: string;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  /** Optional begin/commit/cancel hooks for an undo/history boundary. */
  edit?: EditLifecycle;
  className?: string;
};

/**
 * TextField — a single-line text input with an edit lifecycle.
 *
 * Keeps a draft while focused so the field shows in-progress text; commits the
 * trimmed value on blur or Enter, and restores the previous value on Escape.
 * `onChange` fires only for non-empty input. Works with or without an `edit`
 * lifecycle.
 */
export function TextField({
  label,
  value,
  onChange,
  helperText,
  error,
  maxLength = 100,
  placeholder,
  disabled,
  id: idProp,
  edit,
  className,
}: TextFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const descId = `${id}-desc`;
  const [draft, setDraft] = useState<string | null>(null);
  const hasError = Boolean(error);

  return (
    <FieldShell id={id} label={label} helperText={helperText} error={error} descId={descId} className={className}>
      <input
        id={id}
        type="text"
        value={draft ?? value}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        spellCheck={false}
        aria-invalid={hasError || undefined}
        aria-describedby={helperText || error ? descId : undefined}
        className={fieldInputClasses(hasError, "cursor-text")}
        onFocus={() => {
          runEdit(edit, "beginEdit");
          setDraft(value);
        }}
        onChange={(event) => {
          const text = event.target.value;
          setDraft(text);
          if (text.trim()) {
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
    </FieldShell>
  );
}
