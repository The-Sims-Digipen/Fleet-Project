import { useState } from "react";
import { useProjectStore } from "../state/projectStore";
import { CollapsibleSection } from "./CollapsibleSection";
import { NameField } from "./NameField";
import { DeleteScenarioDialog } from "./ProjectDialogs";

const actionClass = "min-h-8 rounded border border-line-strong px-2.5 text-xs font-semibold text-secondary enabled:hover:bg-white/5 enabled:hover:text-primary disabled:cursor-default disabled:opacity-40";

/** Lists the open project's scenarios (transition plans) and manages the active one. */
export function ScenarioPanel() {
  const scenarios = useProjectStore((state) => state.scenarios);
  const activeScenarioId = useProjectStore((state) => state.activeScenarioId);
  const { selectScenario, createScenario, duplicateScenario, renameScenario } = useProjectStore.getState();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const active = scenarios.find((scenario) => scenario.id === activeScenarioId);

  return <CollapsibleSection title="Scenarios" defaultOpen description="Each scenario is an independent transition plan with its own depot scene. Switching scenarios clears undo history.">
    <div className="overflow-hidden rounded border border-line-strong bg-control">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line-strong px-2 py-1.5">
        <button type="button" className={actionClass} onClick={createScenario}>New Scenario</button>
        <button type="button" className={actionClass} disabled={!active} onClick={() => active && duplicateScenario(active.id)}>Duplicate</button>
        <button type="button" className={actionClass} disabled={scenarios.length <= 1} title={scenarios.length <= 1 ? "A project needs at least one scenario." : undefined}
          onClick={() => setDeletingId(activeScenarioId)}>Delete</button>
        <span className="ml-auto text-xs text-secondary">{scenarios.length}</span>
      </div>
      <ul aria-label="Scenarios" className="m-0 max-h-44 list-none overflow-y-auto overscroll-contain p-1">
        {scenarios.map((scenario, index) => {
          const isActive = scenario.id === activeScenarioId;
          return <li key={scenario.id}>
            <button type="button" aria-pressed={isActive} aria-label={`${scenario.name}, scenario ${index + 1}${isActive ? ", active" : ""}`}
              className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-xs text-secondary hover:bg-white/5 aria-pressed:bg-accent/15 aria-pressed:text-primary"
              onClick={() => selectScenario(scenario.id)}>
              <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${isActive ? "bg-accent" : "border border-line-strong"}`} />
              <span className="min-w-0 flex-1 truncate" title={scenario.name}>{scenario.name}</span>
              {isActive && <span aria-hidden="true" className="shrink-0 font-mono text-[10px] font-bold tracking-wider text-accent uppercase">Active</span>}
            </button>
          </li>;
        })}
      </ul>
    </div>
    {active && <div className="mt-4"><NameField key={active.id} label="Active scenario name" value={active.name} onCommit={(name) => renameScenario(active.id, name)} /></div>}
    {deletingId && <DeleteScenarioDialog scenarioId={deletingId} onDismiss={() => setDeletingId(null)} />}
  </CollapsibleSection>;
}
