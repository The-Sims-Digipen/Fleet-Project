import { useId, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from "react";

export type SliderProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "value" | "onChange" | "min" | "max" | "step"
> & {
  /** Current value. Controlled. */
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Called with the parsed numeric value on change. */
  onChange: (value: number) => void;
  /** Visible label shown above the track. */
  label?: ReactNode;
  /** Unit suffix appended to the value readout (e.g. "%", " kW"). */
  unit?: string;
  /** Hide the numeric readout beside the label. */
  hideValue?: boolean;
};

/**
 * Slider — a themed range input with a value readout and a filled track.
 *
 * The fill is driven by a `--range-fill` custom property so the track shows
 * progress up to the thumb. Consumers style the track/thumb via the shared
 * range CSS; this component owns layout, labelling, and the fill percentage.
 */
export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  unit = "",
  hideValue = false,
  className,
  id,
  ...props
}: SliderProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className={["grid gap-2", className].filter(Boolean).join(" ")}>
      {(label != null || !hideValue) && (
        <div className="flex items-center justify-between gap-3">
          {label != null ? (
            <label htmlFor={inputId} className="font-body text-sm font-medium text-chargedup-night/70">
              {label}
            </label>
          ) : (
            <span />
          )}
          {!hideValue && (
            <output htmlFor={inputId} className="font-body text-sm tabular-nums text-chargedup-night">
              {value}
              {unit}
            </output>
          )}
        </div>
      )}
      <input
        id={inputId}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        style={{ "--range-fill": `${fill}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
        className={["cu-range h-[18px] w-full cursor-pointer appearance-none bg-transparent", "focus-visible:outline-none"].join(" ")}
        {...props}
      />
    </div>
  );
}
