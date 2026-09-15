import { useId, useRef, useState } from "react";
import { validateName } from "../project/types";

/** Text field that commits a valid name on blur or Enter and restores the last valid name on Escape. */
export function NameField({ label, value, onCommit, compact = false }: {
  label: string; value: string; onCommit: (name: string) => void; compact?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const cancelled = useRef(false);
  const id = useId();
  const error = draft === null ? null : validateName(draft);

  return <div className={compact ? "relative grid min-w-0" : "grid min-w-0 gap-2"}>
    <label htmlFor={id} className={compact ? "sr-only" : "text-[0.72rem] font-semibold text-secondary"}>{label}</label>
    <input id={id} type="text" value={draft ?? value} spellCheck={false} aria-invalid={error !== null} aria-describedby={error ? `${id}-error` : undefined}
      className={compact
        ? "h-9 w-full min-w-0 truncate rounded-lg border border-transparent bg-transparent px-2 text-[1.05rem] font-semibold text-primary hover:border-line-strong focus:border-line-strong focus:bg-control aria-invalid:border-red-400 max-[560px]:text-[0.92rem]"
        : "min-h-11 w-full min-w-0 rounded-lg border border-line-strong bg-control px-[11px] text-sm text-primary aria-invalid:border-red-400"}
      onFocus={() => setDraft(value)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (!cancelled.current && draft !== null && !error && draft.trim() !== value) onCommit(draft.trim());
        cancelled.current = false;
        setDraft(null);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== "Escape") return;
        event.preventDefault();
        cancelled.current = event.key === "Escape";
        event.currentTarget.blur();
      }} />
    {error && <p id={`${id}-error`} role="alert" className={compact ? "absolute top-full left-0 z-20 mt-1 w-max max-w-72 rounded border border-line-strong bg-panel px-2 py-1 text-xs text-red-300" : "text-xs text-red-300"}>{error} Press Escape to restore the previous name.</p>}
  </div>;
}
