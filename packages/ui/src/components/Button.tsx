import { forwardRef, type ComponentPropsWithoutRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonSize = "md" | "toolbar";

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-[6px] border font-heading font-bold transition-[filter,background-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chargedup-blue focus-visible:ring-offset-2 focus-visible:ring-offset-chargedup-white disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none";

const sizeClasses: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 py-2 text-sm leading-5",
  // Compact size for dense toolbars and panel action rows.
  toolbar: "min-h-8 px-2.5 py-1 text-xs leading-4",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-chargedup-gold text-chargedup-night enabled:hover:brightness-95 enabled:active:brightness-90",
  secondary:
    "border-chargedup-night bg-chargedup-night text-chargedup-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] enabled:hover:brightness-110 enabled:active:brightness-95",
  ghost:
    "border-transparent bg-transparent text-current enabled:hover:bg-chargedup-grey/40 enabled:active:bg-chargedup-grey/60",
  danger:
    "border-transparent bg-status-danger text-chargedup-white enabled:hover:brightness-110 enabled:active:brightness-95",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, type = "button", variant = "primary", size = "md", ...props },
  ref,
) {
  const classes = [baseClasses, sizeClasses[size], variantClasses[variant], className]
    .filter(Boolean)
    .join(" ");

  return <button ref={ref} className={classes} type={type} {...props} />;
});
