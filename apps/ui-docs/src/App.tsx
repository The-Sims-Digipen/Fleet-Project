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
import { DividerPage } from "./pages/DividerPage";
import { InputPage } from "./pages/InputPage";
import { LabelPage } from "./pages/LabelPage";
import { ModalPage } from "./pages/ModalPage";
import { SelectPage } from "./pages/SelectPage";
import { SpinnerPage } from "./pages/SpinnerPage";
import { TextareaPage } from "./pages/TextareaPage";

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
  "#divider": DividerPage,
  "#input": InputPage,
  "#label": LabelPage,
  "#modal": ModalPage,
  "#select": SelectPage,
  "#spinner": SpinnerPage,
  "#textarea": TextareaPage,
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
