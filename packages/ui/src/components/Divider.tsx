import type { ComponentPropsWithoutRef } from "react";

export type DividerProps = ComponentPropsWithoutRef<"hr"> & {
  /** Adds a text label centred on the divider */
  label?: string;
  /** 'horizontal' (default) or 'vertical' */
  orientation?: "horizontal" | "vertical";
};

export function Divider({ label, orientation = "horizontal", className, ...props }: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={["mx-2 w-px self-stretch bg-chargedup-night/10", className].filter(Boolean).join(" ")}
      />
    );
  }

  if (label) {
    return (
      <div className={["flex items-center gap-3", className].filter(Boolean).join(" ")} role="separator">
        <div className="h-px flex-1 bg-chargedup-night/10" />
        <span className="font-body text-xs uppercase tracking-[0.12em] text-chargedup-night/40">{label}</span>
        <div className="h-px flex-1 bg-chargedup-night/10" />
      </div>
    );
  }

  return (
    <hr
      className={["border-0 border-t border-chargedup-night/10", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
