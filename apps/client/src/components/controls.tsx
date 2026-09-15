import { useId, useState, type CSSProperties } from "react";
import type { Vector3 } from "../scene/types";

export type EditLifecycle = { beginEdit: () => void; commitEdit: () => void; cancelEdit: () => void };

export function NumberControl({ label, value, onChange, min, step = 0.1, edit }: {
  label: string; value: number; onChange: (value: number) => void; min?: number; step?: number; edit: EditLifecycle;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return <label className="grid min-w-0 gap-2 text-[0.72rem] font-semibold text-secondary"><span className="text-[0.62rem]">{label}</span>
    <input className="min-h-[42px] w-full min-w-0 cursor-text rounded-[7px] border border-line-strong bg-control px-2 py-1.5 text-primary" type="number" value={draft ?? Number(value.toFixed(4))} min={min} step={step}
      onFocus={() => { edit.beginEdit(); setDraft(String(Number(value.toFixed(4)))); }}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        const number = Number(text);
        if (text.trim() && Number.isFinite(number) && (min === undefined || number >= min)) {
          edit.beginEdit();
          onChange(number);
        }
      }}
      onBlur={() => { edit.commitEdit(); setDraft(null); }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === "Escape") {
          event.preventDefault();
          if (event.key === "Escape") edit.cancelEdit();
          else edit.commitEdit();
          setDraft(null);
          event.currentTarget.blur();
        }
      }} />
  </label>;
}

export function TextControl({ label, value, onChange, maxLength = 100, edit }: {
  label: string; value: string; onChange: (value: string) => void; maxLength?: number; edit: EditLifecycle;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return <label className="grid min-w-0 gap-2 text-[0.72rem] font-semibold text-secondary"><span>{label}</span>
    <input className="min-h-11 w-full min-w-0 cursor-text rounded-lg border border-line-strong bg-control px-[11px] py-1.5 text-primary" type="text" value={draft ?? value} maxLength={maxLength} spellCheck={false}
      onFocus={() => { edit.beginEdit(); setDraft(value); }}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        if (text.trim()) { edit.beginEdit(); onChange(text); }
      }}
      onBlur={() => { edit.commitEdit(); setDraft(null); }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === "Escape") {
          event.preventDefault();
          if (event.key === "Escape") edit.cancelEdit(); else edit.commitEdit();
          setDraft(null);
          event.currentTarget.blur();
        }
      }} />
  </label>;
}

export function Vector3Control({ label, value, onChange, min, step, edit }: {
  label: string; value: Vector3; onChange: (value: Vector3) => void; min?: number; step?: number; edit: EditLifecycle;
}) {
  return <fieldset className="m-0 min-w-0 border-0 p-0"><legend className="mb-2.5 text-[0.78rem] text-secondary">{label}</legend><div className="grid grid-cols-3 gap-2">
    {(["X", "Y", "Z"] as const).map((axis, index) => <NumberControl key={axis} label={`${label} ${axis}`} value={value[index]} min={min} step={step} edit={edit}
      onChange={(number) => { const next: Vector3 = [...value]; next[index] = number; onChange(next); }} />)}
  </div></fieldset>;
}

const rangeKeys = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"]);
export function RangeControl({ label, value, min, max, unit = "", onChange, edit }: {
  label: string; value: number; min: number; max: number; unit?: string; onChange: (value: number) => void; edit: EditLifecycle;
}) {
  const id = useId();
  return <div className="grid gap-[9px]">
    <div className="flex items-center justify-between gap-3.5"><label className="text-[0.76rem] font-medium text-secondary" htmlFor={id}>{label}</label><output className="font-mono text-[0.76rem] text-primary tabular-nums" htmlFor={id}>{value}{unit}</output></div>
    <input className="h-[18px] w-full appearance-none bg-transparent" id={id} type="range" min={min} max={max} value={value}
      style={{ "--range-fill": `${(value - min) / (max - min) * 100}%` } as CSSProperties}
      onPointerDown={(event) => { edit.beginEdit(); event.currentTarget.setPointerCapture?.(event.pointerId); }}
      onPointerUp={edit.commitEdit} onPointerCancel={edit.cancelEdit} onLostPointerCapture={edit.commitEdit}
      onKeyDown={(event) => { if (rangeKeys.has(event.key)) edit.beginEdit(); if (event.key === "Escape") edit.cancelEdit(); }}
      onKeyUp={(event) => { if (rangeKeys.has(event.key)) edit.commitEdit(); }} onBlur={edit.commitEdit}
      onChange={(event) => onChange(Number(event.target.value))} />
  </div>;
}

export function SelectControl<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void;
}) {
  return <label className="grid gap-2 text-[0.72rem] font-semibold text-secondary"><span>{label}</span><select className="min-h-11 w-full rounded-lg border border-line-strong bg-control px-[11px] text-primary" value={value} onChange={(event) => onChange(event.target.value as T)}>
    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select></label>;
}

export function ColorControl({ label, value, onChange, edit }: {
  label: string; value: string; onChange: (value: string) => void; edit: EditLifecycle;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return <div className="grid gap-2 text-[0.72rem] font-semibold text-secondary"><span>{label}</span><span className="flex min-h-11 w-full items-center gap-[9px] rounded-lg border border-line-strong bg-control px-[11px] text-primary">
    <input className="size-[26px] shrink-0 border-0 bg-transparent p-0" type="color" aria-label={label} value={value} onFocus={edit.beginEdit} onBlur={edit.commitEdit}
      onChange={(event) => { edit.beginEdit(); onChange(event.target.value); }} />
    <input className="h-8 min-w-0 w-full flex-1 cursor-text border-0 bg-transparent p-0 font-mono text-xs text-secondary" type="text" aria-label={`${label} hex`} value={draft ?? value.toUpperCase()} maxLength={7} spellCheck={false}
      onFocus={() => { edit.beginEdit(); setDraft(value); }}
      onChange={(event) => { const text = event.target.value; setDraft(text); if (/^#[0-9a-f]{6}$/i.test(text)) { edit.beginEdit(); onChange(text); } }}
      onBlur={() => { edit.commitEdit(); setDraft(null); }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === "Escape") {
          event.preventDefault();
          if (event.key === "Escape") edit.cancelEdit(); else edit.commitEdit();
          setDraft(null);
          event.currentTarget.blur();
        }
      }} />
  </span></div>;
}
