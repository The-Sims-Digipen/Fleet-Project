import { useId, useState, type ReactNode } from "react";

export function CollapsibleSection({ title, description, defaultOpen = false, children, onBeforeCollapse }: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  onBeforeCollapse?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return <section className="border-t border-line">
    <h3 className="m-0">
      <button className="flex min-h-[58px] w-full items-center justify-between border-0 bg-transparent py-2.5 text-[0.9rem] font-semibold text-primary" type="button" id={`${id}-heading`} aria-expanded={open} aria-controls={id} onClick={() => {
        if (open) onBeforeCollapse?.();
        setOpen(!open);
      }}>
        <span>{title}</span><span className="text-[1.2rem] text-accent" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
    </h3>
    <div id={id} role="region" aria-labelledby={`${id}-heading`} hidden={!open} className="pb-6">
      {description && <p className="mb-4 text-[0.76rem] leading-relaxed text-secondary">{description}</p>}
      {children}
    </div>
  </section>;
}
