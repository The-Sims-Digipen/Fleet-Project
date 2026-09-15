import { useState } from "react";
import { useProjectStore } from "../state/projectStore";
import { CollapsibleSection } from "./CollapsibleSection";
import { DeleteScenarioDialog } from "./ProjectDialogs";
import { NameField } from "./NameField";

const actionClass = "min-h-7 rounded border border-line-strong px-2 text-[0.68rem] font-semibold text-secondary enabled:hover:bg-white/5 enabled:hover:text-primary disabled:cursor-default disabled:opacity-40";

/** Browses the project's in-memory worlds and the scenarios belonging to the selected world. */
export function WorldScenarioPanel() {
  const worlds = useProjectStore((state) => state.worlds);
  const worldId = useProjectStore((state) => state.worldId);
  const worldName = useProjectStore((state) => state.worldName);
  const scenarios = useProjectStore((state) => state.scenarios);
  const activeScenarioId = useProjectStore((state) => state.activeScenarioId);
  const [switchingWorld, setSwitchingWorld] = useState(false);
  const [worldError, setWorldError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const active = scenarios.find((scenario) => scenario.id === activeScenarioId);

  async function chooseWorld(nextWorldId: string) {
    if (nextWorldId === worldId || switchingWorld) return;
    setSwitchingWorld(true);
    setWorldError(null);
    try {
      await useProjectStore.getState().switchWorld(nextWorldId);
    } catch (reason) {
      setWorldError(reason instanceof Error ? reason.message : "The world could not be opened.");
    } finally {
      setSwitchingWorld(false);
    }
  }

  return <CollapsibleSection title="World & Scenarios" defaultOpen description="Worlds and scenarios stay in this project workspace until Save Project writes the complete workspace to browser storage.">
    <div className="overflow-hidden rounded border border-line-strong bg-control">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line-strong px-2 py-1.5">
        <span className="mr-auto text-[0.68rem] font-semibold text-secondary">Worlds</span>
        <button type="button" aria-label="New world" className={actionClass} disabled={switchingWorld} onClick={() => useProjectStore.getState().newWorld()}>New</button>
        <button type="button" aria-label="Duplicate world" className={actionClass} disabled={switchingWorld} onClick={() => useProjectStore.getState().duplicateWorld()}>Duplicate</button>
      </div>
      <ul aria-label="Worlds" className="m-0 max-h-40 list-none overflow-y-auto overscroll-contain p-1">
        {worlds.map((world, index) => {
          const isActive = world.id === worldId;
          const isUnsaved = world.revision === 0;
          return <li key={world.id}>
            <button type="button" aria-pressed={isActive} disabled={switchingWorld}
              aria-label={`${world.name}, world ${index + 1}${isActive ? ", active" : isUnsaved ? ", unsaved" : ", saved"}`}
              className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-xs text-secondary hover:bg-white/5 aria-pressed:bg-accent/15 aria-pressed:text-primary disabled:cursor-default disabled:opacity-50"
              onClick={() => void chooseWorld(world.id)}>
              <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${isActive ? "bg-accent" : "border border-line-strong"}`} />
              <span className="min-w-0 flex-1 truncate" title={world.name}>{world.name}</span>
              <span aria-hidden="true" className={`shrink-0 font-mono text-[9px] font-bold tracking-wider uppercase ${isActive ? "text-accent" : "text-secondary"}`}>
                {isActive ? "Active" : isUnsaved ? "Unsaved" : "Saved"}
              </span>
            </button>
          </li>;
        })}
      </ul>
    </div>
    {switchingWorld && <p className="mt-2 text-xs text-secondary" role="status">Switching world…</p>}
    {worldError && <p role="alert" className="mt-2 text-xs text-red-300">{worldError}</p>}

    <div className="mt-4"><NameField key={worldId} label="Active world name" value={worldName} onCommit={(name) => useProjectStore.getState().renameWorld(name)} /></div>

    <div className="mt-4 overflow-hidden rounded border border-line-strong bg-control">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line-strong px-2 py-1.5">
        <span className="mr-auto text-[0.68rem] font-semibold text-secondary">Scenarios for {worldName}</span>
        <button type="button" aria-label="New scenario" className={actionClass} onClick={() => useProjectStore.getState().createScenario()}>New</button>
        <button type="button" aria-label="Duplicate scenario" className={actionClass} disabled={!active} onClick={() => active && useProjectStore.getState().duplicateScenario(active.id)}>Duplicate</button>
        <button type="button" aria-label="Remove scenario" className={actionClass} disabled={scenarios.length <= 1}
          title={scenarios.length <= 1 ? "A world needs at least one scenario." : "Remove this scenario from the project workspace. The removal is persisted on Save Project."}
          onClick={() => setDeletingId(activeScenarioId)}>Remove</button>
      </div>
      <ul aria-label="Scenarios for selected world" className="m-0 max-h-52 list-none overflow-y-auto overscroll-contain p-1">
        {scenarios.map((scenario, index) => {
          const isActive = scenario.id === activeScenarioId;
          return <li key={scenario.id}>
            <button type="button" aria-pressed={isActive}
              aria-label={`${scenario.name}, scenario ${index + 1}${isActive ? ", active" : scenario.revision === 0 ? ", unsaved" : ", saved"}`}
              className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-xs text-secondary hover:bg-white/5 aria-pressed:bg-accent/15 aria-pressed:text-primary"
              onClick={() => useProjectStore.getState().selectScenario(scenario.id)}>
              <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${isActive ? "bg-accent" : "border border-line-strong"}`} />
              <span className="min-w-0 flex-1 truncate" title={scenario.name}>{scenario.name}</span>
              <span aria-hidden="true" className={`shrink-0 font-mono text-[9px] font-bold tracking-wider uppercase ${isActive ? "text-accent" : "text-secondary"}`}>
                {isActive ? "Active" : scenario.revision === 0 ? "Unsaved" : "Saved"}
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
