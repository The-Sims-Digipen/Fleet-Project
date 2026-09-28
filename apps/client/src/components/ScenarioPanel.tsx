import { useState } from "react";
import { useProjectStore } from "../state/projectStore";
import { CollapsibleSection } from "./CollapsibleSection";
import { DeleteScenarioDialog } from "./ProjectDialogs";
import { NameField } from "./NameField";

const actionClass = "min-h-7 rounded border border-line-strong px-2 text-[0.68rem] font-semibold text-secondary enabled:hover:bg-white/5 enabled:hover:text-primary disabled:cursor-default disabled:opacity-40";

/** Manages the alternative plans that share the Project's one environment and fleet. */
export function ScenarioPanel() {
  const scenarios = useProjectStore((state) => state.runtime.document.scenarios);
  const activeScenarioId = useProjectStore((state) => state.runtime.document.activeScenarioId);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const active = scenarios.find((scenario) => scenario.id === activeScenarioId);

  return <CollapsibleSection title="Scenarios" defaultOpen description="Alternative plans share this Project's depot and authoritative fleet. Save Project writes the complete workspace to browser storage.">
    <div className="overflow-hidden rounded border border-line-strong bg-control">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line-strong px-2 py-1.5">
        <span className="mr-auto text-[0.68rem] font-semibold text-secondary">Project scenarios</span>
        <button type="button" aria-label="New scenario" className={actionClass} onClick={() => useProjectStore.getState().createScenario()}>New</button>
        <button type="button" aria-label="Duplicate scenario" className={actionClass} disabled={!active} onClick={() => active && useProjectStore.getState().duplicateScenario(active.id)}>Duplicate</button>
        <button type="button" aria-label="Remove scenario" className={actionClass} disabled={scenarios.length <= 1}
          title={scenarios.length <= 1 ? "A project needs at least one scenario." : "Remove this scenario from the project. The removal is persisted on Save Project."}
          onClick={() => setDeletingId(activeScenarioId)}>Remove</button>
      </div>
      <ul aria-label="Project scenarios" className="m-0 max-h-52 list-none overflow-y-auto overscroll-contain p-1">
        {scenarios.map((scenario, index) => {
          const isActive = scenario.id === activeScenarioId;
          return <li key={scenario.id}>
            <button type="button" aria-pressed={isActive}
              aria-label={`${scenario.name}, scenario ${index + 1}${isActive ? ", active" : ""}`}
              className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-xs text-secondary hover:bg-white/5 aria-pressed:bg-accent/15 aria-pressed:text-primary"
              onClick={() => useProjectStore.getState().selectScenario(scenario.id)}>
              <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${isActive ? "bg-accent" : "border border-line-strong"}`} />
              <span className="min-w-0 flex-1 truncate" title={scenario.name}>{scenario.name}</span>
              <span aria-hidden="true" className={`shrink-0 font-mono text-[9px] font-bold tracking-wider uppercase ${isActive ? "text-accent" : "text-secondary"}`}>
                {isActive ? "Active" : `Plan ${index + 1}`}
              </span>
            </button>
          </li>;
        })}
      </ul>
    </div>
    {active && <div className="mt-4"><NameField key={active.id} label="Active scenario name" value={active.name} onCommit={(name) => useProjectStore.getState().renameScenario(active.id, name)} /></div>}
    {deletingId && <DeleteScenarioDialog scenarioId={deletingId} onDismiss={() => setDeletingId(null)} />}
  </CollapsibleSection>;
}
