import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type CardVariant = "default" | "flat" | "dark";

export type CardProps = ComponentPropsWithoutRef<"div"> & {
  variant?: CardVariant;
  /** Optional header content rendered above the body with a divider */
  header?: ReactNode;
  /** Optional footer content rendered below a top divider */
  footer?: ReactNode;
};

const variantBase: Record<CardVariant, string> = {
  default:
    "bg-surface-raised border border-ink/10 shadow-sm",
  flat: "bg-surface-raised border border-ink/10",
  // `dark` is a deliberately inverted card (dark surface regardless of theme),
  // so it keeps the fixed brand Night Blue rather than the theme-aware surface.
  dark: "bg-chargedup-night border border-chargedup-white/10 text-chargedup-white",
};

export function Card({ variant = "default", header, footer, children, className, ...props }: CardProps) {
  const isDark = variant === "dark";
  const dividerClass = isDark ? "border-chargedup-white/10" : "border-ink/10";

  return (
    <div
      className={[
        "overflow-hidden rounded-[10px]",
        variantBase[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {header && (
        <>
          <div className="px-6 py-4">{header}</div>
          <div className={`border-t ${dividerClass}`} />
        </>
      )}
      <div className="px-6 py-5">{children}</div>
      {footer && (
        <>
          <div className={`border-t ${dividerClass}`} />
          <div className="px-6 py-4">{footer}</div>
        </>
      )}
    </div>
  );
}
