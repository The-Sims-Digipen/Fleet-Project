import type { ComponentPropsWithoutRef } from "react";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

export type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "bg-chargedup-grey text-chargedup-night border-chargedup-night/15",
  success:
    "bg-status-success/10 text-status-success border-status-success/25",
  warning:
    "bg-status-warning/10 text-status-warning border-status-warning/25",
  danger:
    "bg-status-danger/10 text-status-danger border-status-danger/25",
  info:
    "bg-chargedup-blue/10 text-chargedup-blue border-chargedup-blue/25",
};

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  const classes = [
    "inline-flex items-center rounded-full border px-2.5 py-0.5 font-body text-xs font-semibold leading-5",
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes} {...props} />;
}
