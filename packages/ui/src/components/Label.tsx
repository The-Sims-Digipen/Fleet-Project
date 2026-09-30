import type { ComponentPropsWithoutRef, ElementType } from "react";

export type LabelVariant = "eyebrow" | "section" | "caption";

export type LabelProps<T extends ElementType = "p"> = {
  as?: T;
  variant?: LabelVariant;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

const variantClasses: Record<LabelVariant, string> = {
  /** Small all-caps overline label — BrandBook "eyebrow" style */
  eyebrow: "font-body text-xs font-semibold uppercase tracking-[0.2em] text-chargedup-blue",
  /** Section-level label in Night Blue */
  section: "font-body text-xs font-semibold uppercase tracking-[0.16em] text-chargedup-night/65",
  /** De-emphasised caption text */
  caption: "font-body text-xs text-chargedup-night/50",
};

/**
 * Typography component for labels, eyebrows, and captions derived from the BrandBook.
 * Defaults to a `<p>` element; change with the `as` prop.
 */
export function Label<T extends ElementType = "p">({
  as,
  variant = "eyebrow",
  className,
  ...props
}: LabelProps<T>) {
  const Tag = (as ?? "p") as ElementType;
  return (
    <Tag
      className={[variantClasses[variant], className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
