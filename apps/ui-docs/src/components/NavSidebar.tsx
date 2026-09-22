import { useState } from "react";

export type NavItem = {
  label: string;
  href: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Getting Started",
    items: [
      { label: "Overview", href: "#overview" },
      { label: "Installation", href: "#installation" },
    ],
  },
  {
    title: "Foundations",
    items: [
      { label: "Color Palette", href: "#palette" },
      { label: "Typography", href: "#typography" },
      { label: "Spacing & Radius", href: "#spacing" },
    ],
  },
  {
    title: "Components",
    items: [
      { label: "Alert", href: "#alert" },
      { label: "Badge", href: "#badge" },
      { label: "Button", href: "#button" },
      { label: "Card", href: "#card" },
      { label: "Checkbox", href: "#checkbox" },
      { label: "Collapsible Section", href: "#collapsible-section" },
      { label: "Divider", href: "#divider" },
      { label: "Input", href: "#input" },
      { label: "Label", href: "#label" },
      { label: "List Panel", href: "#list-panel" },
      { label: "Modal", href: "#modal" },
      { label: "Select", href: "#select" },
      { label: "Spinner", href: "#spinner" },
      { label: "Textarea", href: "#textarea" },
    ],
  },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <a
      href={item.href}
      className={[
        "group flex min-w-0 items-center rounded-[6px] px-3 py-[7px] font-body text-sm transition-colors duration-100",
        active
          ? "bg-chargedup-gold/15 font-semibold text-chargedup-night"
          : "text-chargedup-night/60 hover:bg-chargedup-night/5 hover:text-chargedup-night",
      ].join(" ")}
    >
      {active && (
        <span className="mr-2.5 h-4 w-0.5 shrink-0 rounded-full bg-chargedup-gold" aria-hidden="true" />
      )}
      <span className="truncate">{item.label}</span>
    </a>
  );
}

export function NavSidebar({ activeHash }: { activeHash: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <nav aria-label="Documentation navigation" className="flex flex-col gap-6 px-4 py-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 font-body text-[0.68rem] font-bold uppercase tracking-[0.18em] text-chargedup-night/35">
            {group.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <NavLink item={item} active={activeHash === item.href} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar — the <aside> stretches to the full body-row height so
          its surface never leaves a gap, while the inner region stays pinned to
          the viewport and scrolls independently. */}
      <aside
        className="hidden w-[240px] shrink-0 border-r border-chargedup-night/10 bg-chargedup-white lg:block"
        aria-label="Sidebar"
      >
        <div className="sticky top-[64px] max-h-[calc(100dvh-64px)] overflow-x-hidden overflow-y-auto">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile hamburger */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <button
          type="button"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="flex size-12 items-center justify-center rounded-full bg-chargedup-night text-chargedup-white shadow-lg hover:bg-chargedup-night/90"
        >
          {mobileOpen ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-chargedup-night/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[70dvh] overflow-y-auto rounded-t-2xl bg-chargedup-white shadow-xl lg:hidden"
            aria-label="Sidebar"
          >
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
