import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type FieldsetProps = Omit<ComponentPropsWithoutRef<"fieldset">, "title"> & {
  /** Section title, rendered as the `<legend>`. */
  title: ReactNode;
  /** Optional supporting description shown beneath the title. */
  description?: ReactNode;
  /** The grouped form controls. */
  children: ReactNode;
};

/**
 * Fieldset — a titled form section that groups related controls.
 *
 * Uses a native `<fieldset>`/`<legend>` so the title is announced as the group's
 * name for every control inside it. The legend sits above a bordered surface,
 * and children are laid out in a simple vertical stack the consumer can override
 * per control (e.g. wrapping pairs in their own grid).
 */
export function Fieldset({ title, description, className, children, ...props }: FieldsetProps) {
  return (
    <fieldset
      className={[
        "m-0 min-w-0 rounded-[10px] border border-chargedup-night/10 bg-chargedup-white p-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <legend className="px-1 font-heading text-sm font-bold text-chargedup-night">
        {title}
      </legend>
      {description != null && (
        <p className="mb-3 font-body text-xs leading-relaxed text-chargedup-night/55">
          {description}
        </p>
      )}
      <div className="grid gap-4">{children}</div>
    </fieldset>
  );
}
