import { useEffect, useMemo, useState } from "react";
import type { Scenario, WorldSummary } from "../project/types";
import { useProjectDirty, useProjectStore } from "../state/projectStore";
import { CollapsibleSection } from "./CollapsibleSection";
import { DeleteScenarioDialog } from "./ProjectDialogs";
import { NameField } from "./NameField";

const actionClass = "min-h-7 rounded border border-line-strong px-2 text-[0.68rem] font-semibold text-secondary enabled:hover:bg-white/5 enabled:hover:text-primary disabled:cursor-default disabled:opacity-40";

type WorldListState =
  | { state: "loading" }
  | { state: "ready"; worlds: WorldSummary[] }
  | { state: "error"; message: string };

function mergeScenarios(attached: Scenario[], saved: Scenario[]) {
  const attachedIds = new Set(attached.map((scenario) => scenario.id));
  return [...attached.map((scenario) => ({ scenario, attached: true })), ...saved.filter((scenario) => !attachedIds.has(scenario.id)).map((scenario) => ({ scenario, attached: false }))];
}

/** Chooses a reusable 3D world and exposes the scenarios that belong to it in one place. */
export function WorldScenarioPanel() {
  const projectName = useProjectStore((state) => state.name);
  const projectId = useProjectStore((state) => state.projectId);
  const worldId = useProjectStore((state) => state.worldId);
  const worldName = useProjectStore((state) => state.worldName);
  const worldRevision = useProjectStore((state) => state.worldRevision);
  const scenarios = useProjectStore((state) => state.scenarios);
  const savedWorldScenarios = useProjectStore((state) => state.worldScenarios);
  const activeScenarioId = useProjectStore((state) => state.activeScenarioId);
  const dirty = useProjectDirty();
  const [worlds, setWorlds] = useState<WorldListState>({ state: "loading" });
  const [switchingWorld, setSwitchingWorld] = useState(false);
  const [worldError, setWorldError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const items = useMemo(() => mergeScenarios(scenarios, savedWorldScenarios), [scenarios, savedWorldScenarios]);
  const active = scenarios.find((scenario) => scenario.id === activeScenarioId);

  useEffect(() => {
    let mounted = true;
    useProjectStore.getState().listWorlds().then(
      (savedWorlds) => { if (mounted) setWorlds({ state: "ready", worlds: savedWorlds }); },
      (reason: unknown) => { if (mounted) setWorlds({ state: "error", message: reason instanceof Error ? reason.message : "Saved worlds could not be loaded." }); },
    );
    return () => { mounted = false; };
  }, [worldId]);

  async function chooseWorld(nextWorldId: string) {
    if (nextWorldId === worldId || switchingWorld) return;
    const warning = projectId
      ? `Switching worlds starts a new unsaved copy of “${projectName}”. The saved project will not be changed.${dirty ? " Current unsaved changes will be discarded." : ""} Continue?`
      : dirty || worldRevision === 0
        ? `Switching worlds will discard the current unsaved workspace “${projectName}”. Continue?`
        : null;
    if (warning && !window.confirm(warning)) return;

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

  return <CollapsibleSection title="World & Scenarios" defaultOpen description="Choose the physical 3D world first. The scenario chooser then shows only plans saved for that world.">
    <div className="grid gap-2">
      <label htmlFor="world-scenario-world" className="text-[0.72rem] font-semibold text-secondary">World</label>
      <select id="world-scenario-world" aria-label="World" value={worldId} disabled={switchingWorld}
        onChange={(event) => void chooseWorld(event.target.value)}
        className="min-h-10 rounded-lg border border-line-strong bg-control px-[11px] text-sm text-primary disabled:opacity-50">
        <option value={worldId}>{worldName}{worldRevision === 0 ? " (unsaved)" : ""}</option>
        {worlds.state === "ready" && worlds.worlds.filter((world) => world.id !== worldId).map((world) => <option key={world.id} value={world.id}>{world.name}</option>)}
      </select>
      {switchingWorld && <p className="text-xs text-secondary" role="status">Opening world…</p>}
      {worlds.state === "loading" && !switchingWorld && <p className="text-xs text-secondary">Loading saved worlds…</p>}
      {worlds.state === "error" && <p className="text-xs text-amber-200">Saved worlds unavailable: {worlds.message}</p>}
      {worldError && <p role="alert" className="text-xs text-red-300">{worldError}</p>}
    </div>

    <div className="mt-5 overflow-hidden rounded border border-line-strong bg-control">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line-strong px-2 py-1.5">
        <span className="mr-auto text-[0.68rem] font-semibold text-secondary">Scenarios for {worldName}</span>
        <button type="button" aria-label="New scenario" className={actionClass} onClick={() => useProjectStore.getState().createScenario()}>New</button>
        <button type="button" aria-label="Duplicate scenario" className={actionClass} disabled={!active} onClick={() => active && useProjectStore.getState().duplicateScenario(active.id)}>Duplicate</button>
        <button type="button" aria-label="Remove scenario" className={actionClass} disabled={scenarios.length <= 1} title={scenarios.length <= 1 ? "A project needs at least one linked scenario." : "Unlink this scenario from the project; it remains saved for this world."}
          onClick={() => setDeletingId(activeScenarioId)}>Remove</button>
      </div>
      <ul aria-label="Scenarios for selected world" className="m-0 max-h-52 list-none overflow-y-auto overscroll-contain p-1">
        {items.map(({ scenario, attached }, index) => {
          const isActive = attached && scenario.id === activeScenarioId;
          return <li key={scenario.id}>
            <button type="button" aria-pressed={isActive}
              aria-label={`${scenario.name}, scenario ${index + 1}${isActive ? ", active" : attached ? ", linked" : ", available"}`}
              className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-xs text-secondary hover:bg-white/5 aria-pressed:bg-accent/15 aria-pressed:text-primary"
              onClick={() => {
                if (attached) useProjectStore.getState().selectScenario(scenario.id);
                else useProjectStore.getState().attachScenario(scenario);
              }}>
              <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${isActive ? "bg-accent" : attached ? "border border-accent/70" : "border border-line-strong"}`} />
              <span className="min-w-0 flex-1 truncate" title={scenario.name}>{scenario.name}</span>
              <span aria-hidden="true" className={`shrink-0 font-mono text-[9px] font-bold tracking-wider uppercase ${isActive ? "text-accent" : "text-secondary"}`}>
                {isActive ? "Active" : attached ? "Linked" : "Saved"}
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
