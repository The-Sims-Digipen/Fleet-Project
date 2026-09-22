import { useId, useState, type ReactNode } from "react";

export type CollapsibleSectionProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  onBeforeCollapse?: () => void;
  /** Visual variant — 'light' renders on white/grey surface, 'dark' on Night Blue */
  variant?: "light" | "dark";
};

/**
 * Accordion section extracted and formalised from the ChargedUp product UI.
 * Fully accessible: aria-expanded, aria-controls, region role.
 */
export function CollapsibleSection({
  title,
  description,
  defaultOpen = false,
  children,
  onBeforeCollapse,
  variant = "light",
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  const isDark = variant === "dark";

  return (
    <section
      className={[
        "border-t",
        isDark
          ? "border-chargedup-white/10 bg-chargedup-night/5"
          : "border-chargedup-night/10 bg-chargedup-white/60",
      ].join(" ")}
    >
      <h3 className="m-0">
        <button
          type="button"
          id={`${id}-heading`}
          aria-expanded={open}
          aria-controls={id}
          className={[
            "flex min-h-[58px] w-full items-center justify-between border-0 bg-transparent px-6 py-3 font-heading text-[0.9rem] font-bold transition-colors duration-150",
            isDark
              ? "text-chargedup-white hover:text-chargedup-gold"
              : "text-chargedup-night hover:text-chargedup-blue",
          ].join(" ")}
          onClick={() => {
            if (open) onBeforeCollapse?.();
            setOpen((prev) => !prev);
          }}
        >
          <span>{title}</span>
          <span
            className={[
              "flex size-6 items-center justify-center rounded-full text-base transition-transform duration-200",
              isDark ? "text-chargedup-gold" : "text-chargedup-blue",
              open && "rotate-180",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden="true"
          >
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </h3>

      <div
        id={id}
        role="region"
        aria-labelledby={`${id}-heading`}
        hidden={!open}
        className="px-6 pb-6"
      >
        {description && (
          <p className="mb-4 font-body text-sm leading-relaxed text-chargedup-night/60">
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
