import { useEffect, useState, type FC } from "react";
import { NavSidebar } from "./components/NavSidebar";

// Pages
import { OverviewPage } from "./pages/OverviewPage";
import { FoundationsPage } from "./pages/FoundationsPage";
import { AlertPage } from "./pages/AlertPage";
import { BadgePage } from "./pages/BadgePage";
import { ButtonPage } from "./pages/ButtonPage";
import { CardPage } from "./pages/CardPage";
import { CheckboxPage } from "./pages/CheckboxPage";
import { CollapsibleSectionPage } from "./pages/CollapsibleSectionPage";
import { DataTablePage } from "./pages/DataTablePage";
import { DividerPage } from "./pages/DividerPage";
import { FieldsPage } from "./pages/FieldsPage";
import { FieldsetPage } from "./pages/FieldsetPage";
import { InputPage } from "./pages/InputPage";
import { LabelPage } from "./pages/LabelPage";
import { ListPanelPage } from "./pages/ListPanelPage";
import { ModalPage } from "./pages/ModalPage";
import { ProgressBarPage } from "./pages/ProgressBarPage";
import { SegmentedControlPage } from "./pages/SegmentedControlPage";
import { SelectPage } from "./pages/SelectPage";
import { SliderPage } from "./pages/SliderPage";
import { SplitPanePage } from "./pages/SplitPanePage";
import { SpinnerPage } from "./pages/SpinnerPage";
import { StatCardPage } from "./pages/StatCardPage";
import { StatusBannerPage } from "./pages/StatusBannerPage";
import { TextareaPage } from "./pages/TextareaPage";
import { ToastPage } from "./pages/ToastPage";

const HASH_TO_PAGE: Record<string, FC> = {
  "": OverviewPage,
  "#overview": OverviewPage,
  "#installation": OverviewPage,
  "#palette": FoundationsPage,
  "#typography": FoundationsPage,
  "#spacing": FoundationsPage,
  "#alert": AlertPage,
  "#badge": BadgePage,
  "#button": ButtonPage,
  "#card": CardPage,
  "#checkbox": CheckboxPage,
  "#collapsible-section": CollapsibleSectionPage,
  "#data-table": DataTablePage,
  "#divider": DividerPage,
  "#fields": FieldsPage,
  "#fieldset": FieldsetPage,
  "#input": InputPage,
  "#label": LabelPage,
  "#list-panel": ListPanelPage,
  "#modal": ModalPage,
  "#progress-bar": ProgressBarPage,
  "#segmented-control": SegmentedControlPage,
  "#select": SelectPage,
  "#slider": SliderPage,
  "#split-pane": SplitPanePage,
  "#spinner": SpinnerPage,
  "#stat-card": StatCardPage,
  "#status-banner": StatusBannerPage,
  "#textarea": TextareaPage,
  "#toast": ToastPage,
};

function getPage(hash: string): FC {
  return HASH_TO_PAGE[hash] ?? OverviewPage;
}
const HEADER_OFFSET = 64;

export function App() {
  const [hash, setHash] = useState(() => window.location.hash || "");

  useEffect(() => {
    function onHashChange() {
      setHash(window.location.hash || "");
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const id = hash.replace(/^#/, "");
    const target = id ? document.getElementById(id) : null;
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top, behavior: "instant" });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [hash]);

  const Page = getPage(hash);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-chargedup-white/10 bg-chargedup-night px-6 shadow-md">
        <a
          href="#overview"
          className="flex items-center gap-2.5 font-heading text-base font-bold text-chargedup-white hover:text-chargedup-gold transition-colors"
        >
          {/* Lightning bolt logo mark */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M13 2L4.5 13.5H11L10 22l8.5-12H13L13 2z" fill="#e8ba44" stroke="#e8ba44" strokeWidth="1" strokeLinejoin="round" />
          </svg>
          ChargedUp UI
        </a>
        <div className="mx-2 h-5 w-px bg-chargedup-white/15" aria-hidden="true" />
        <span className="rounded-full bg-chargedup-white/10 px-2.5 py-0.5 font-mono text-[0.68rem] text-chargedup-gold">
          v0.1.0
        </span>
        <div className="flex-1" />
        <a
          href="#button"
          className="hidden font-body text-sm text-chargedup-white/60 hover:text-chargedup-white sm:block"
        >
          Components
        </a>
        <a
          href="#palette"
          className="hidden font-body text-sm text-chargedup-white/60 hover:text-chargedup-white sm:block"
        >
          Foundations
        </a>
      </header>

      {/* Body. Use overflow-x-clip (not overflow-x-hidden) so this row does not
          become a vertical scroll container — the page stays the single scroller
          and the sidebar's sticky offset resolves correctly. */}
      <div className="flex min-w-0 flex-1 overflow-x-clip">
        <NavSidebar activeHash={hash} />

        {/* Main content */}
        <main
          id="main-content"
          className="min-w-0 flex-1 overflow-x-clip px-6 py-10 sm:px-10 lg:px-14"
          tabIndex={-1}
        >
          <div className="mx-auto max-w-[820px]">
            <Page />
          </div>
        </main>
      </div>
    </div>
  );
}
