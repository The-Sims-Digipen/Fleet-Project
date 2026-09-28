export type SpinnerSize = "sm" | "md" | "lg";
export type SpinnerColor = "gold" | "night" | "blue" | "white";

export type SpinnerProps = {
  size?: SpinnerSize;
  color?: SpinnerColor;
  /** Screen-reader label */
  label?: string;
};

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-9 border-[3px]",
};

const colorClasses: Record<SpinnerColor, string> = {
  gold: "border-chargedup-gold/25 border-t-chargedup-gold",
  night: "border-chargedup-night/20 border-t-chargedup-night",
  blue: "border-chargedup-blue/25 border-t-chargedup-blue",
  white: "border-chargedup-white/25 border-t-chargedup-white",
};

/**
 * Animated loading spinner. Uses a CSS border-based approach for zero JS overhead.
 */
export function Spinner({ size = "md", color = "night", label = "Loading…" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={[
        "inline-block animate-spin rounded-full motion-reduce:animate-none",
        sizeClasses[size],
        colorClasses[color],
      ].join(" ")}
    />
  );
}
