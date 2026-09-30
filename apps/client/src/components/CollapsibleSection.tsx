import { useId, type ReactNode } from "react";
import { useAppStore, type SidebarPanelId } from "../state/appStore";

export function CollapsibleSection({ panelId, title, description, children, onBeforeCollapse }: {
  panelId: SidebarPanelId;
  title: string;
  description?: string;
  children: ReactNode;
  onBeforeCollapse?: () => void;
}) {
  const open = useAppStore((state) => state.sidebarPanels[panelId]);
  const setExpanded = useAppStore((state) => state.setSidebarPanelExpanded);
  const id = useId();
  return <section className="-mx-7 border-t border-line bg-[#10201d] px-7 max-[560px]:-mx-5 max-[560px]:px-5">
    <h3 className="m-0">
      <button className="flex min-h-[58px] w-full items-center justify-between border-0 bg-transparent py-2.5 text-[0.9rem] font-semibold text-primary" type="button" id={`${id}-heading`} aria-expanded={open} aria-controls={id} onClick={() => {
        if (open) onBeforeCollapse?.();
        setExpanded(panelId, !open);
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
