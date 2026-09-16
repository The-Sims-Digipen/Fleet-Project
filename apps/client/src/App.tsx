import { Component, lazy, Suspense, useMemo, useState, type ReactNode } from "react";
import { CompareWorkspace } from "./components/CompareWorkspace";
import { effectivePresetForYear, resolveVehiclePlan } from "./project/comparisonModel";
import { createObject } from "./scene/catalog";
import type { SceneObject } from "./scene/types";
import { HistoryControls } from "./components/HistoryControls";
import { ProjectControls } from "./components/ProjectControls";
import { ResizableWorkspace } from "./components/ResizableWorkspace";
import { Sidebar } from "./components/Sidebar";
import { TransformToolbar } from "./components/TransformToolbar";
import { useFleetStore } from "./state/fleetStore";
import { usePresetStore } from "./state/presetStore";
import { useProjectStore } from "./state/projectStore";
import { useTimelineStore } from "./state/timelineStore";

const LazyWorldScene = lazy(() => import("./components/WorldScene").then((module) => ({ default: module.WorldScene })));

type WorkspaceMode = "plan" | "compare";

class ViewportBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="grid h-full place-items-center p-8 text-center text-secondary" role="alert">The 3D viewport could not load. You can still edit the scene in the sidebar.</div> : this.props.children;
  }
}

export default function App() {
  const [cameraReset, setCameraReset] = useState(0);
  const [fleetPreviewOpen, setFleetPreviewOpen] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("plan");
  const vehicles = useFleetStore((state) => state.vehicles);
  const selectedYear = useTimelineStore((state) => state.selectedYear);
  const presets = usePresetStore((state) => state.presets);
  const scenarios = useProjectStore((state) => state.scenarios);
  const activeScenarioId = useProjectStore((state) => state.activeScenarioId);
  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId) ?? scenarios[0];
  const previewObjects: SceneObject[] | null = useMemo(() => fleetPreviewOpen && activeScenario ? vehicles.flatMap((vehicle, index) => {
    const preset = effectivePresetForYear(activeScenario, vehicle, presets, selectedYear);
    if (!preset) return [];
    const plan = resolveVehiclePlan(activeScenario, vehicle, presets);
    const changed = plan.transitionYear !== null && selectedYear >= plan.transitionYear && plan.targetPresetId !== vehicle.currentPreset;
    const object = createObject(preset.modelId || "van", `fleet-preview-${vehicle.vehicleId}`, preset.id, `${vehicle.vehicleId} · ${vehicle.vehicleName}${changed ? " · Changed" : ""}`);
    if (!object) return [];
    object.transform.position = [(index - (vehicles.length - 1) / 2) * 4.5, 0, 0];
    object.appearance = { tint: changed ? "#39ff14" : preset.propulsion === "electric" ? "#85d8ff" : preset.propulsion === "hybrid" ? "#f5d18a" : "#ffffff" };
    return [object];
  }) : null, [activeScenario, fleetPreviewOpen, presets, selectedYear, vehicles]);

  return <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-surface">
    <a className="fixed top-3 left-3 z-50 -translate-y-[160%] rounded-lg bg-accent px-3.5 py-2.5 font-extrabold text-accent-ink focus:translate-y-0" href={workspaceMode === "compare" ? "#compare-workspace" : "#controls"}>Skip to workspace</a>
    <header className="flex shrink-0 min-h-[72px] flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-line bg-surface/95 px-[clamp(18px,3vw,40px)] py-3 max-[560px]:min-h-16 max-[560px]:px-4">
      <div className="flex min-w-0 items-center gap-3"><span className="grid size-[42px] shrink-0 place-items-center rounded-[10px] border border-[#355149] bg-[#0f211d] text-accent max-[560px]:size-[38px]" aria-hidden="true">◇</span><div><p className="mb-0.5 block font-mono text-[0.68rem] font-bold tracking-[0.14em] text-accent uppercase">Starter</p><h1 className="text-[1.05rem] font-semibold max-[560px]:text-[0.92rem]">3D Playground</h1></div></div>
      <div className="flex items-center gap-3">
        <ProjectControls />
        <div className="flex rounded-lg border border-line-strong bg-control p-1" role="tablist" aria-label="Workspace view">
          <button type="button" role="tab" aria-selected={workspaceMode === "plan"} className={`min-h-9 rounded px-3 text-xs font-bold ${workspaceMode === "plan" ? "bg-accent text-accent-ink" : "text-secondary hover:text-primary"}`} onClick={() => setWorkspaceMode("plan")}>Plan / Depot</button>
          <button type="button" role="tab" aria-selected={workspaceMode === "compare"} className={`min-h-9 rounded px-3 text-xs font-bold ${workspaceMode === "compare" ? "bg-accent text-accent-ink" : "text-secondary hover:text-primary"}`} onClick={() => { setFleetPreviewOpen(false); setWorkspaceMode("compare"); }}>Compare</button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {workspaceMode === "plan" && <HistoryControls />}
        <span className="flex min-h-9 items-center gap-2 rounded-full border border-line px-[13px] text-xs font-semibold text-secondary max-[560px]:w-9 max-[560px]:justify-center max-[560px]:px-0 max-[560px]:text-[0px]"><i className="size-[7px] shrink-0 rounded-full bg-accent shadow-[0_0_10px_#55d6be80]" aria-hidden="true" />Shared world</span>
      </div>
    </header>

    {workspaceMode === "compare" ? <CompareWorkspace /> : <ResizableWorkspace>
      <section className="relative min-h-0 min-w-0 overflow-hidden bg-surface" aria-labelledby="scene-title">
        <ViewportBoundary><Suspense fallback={<div className="grid h-full place-items-center p-8 text-center text-secondary">Loading 3D world…</div>}><LazyWorldScene cameraReset={cameraReset} fleetPreview={previewObjects} /></Suspense></ViewportBoundary>
        {!fleetPreviewOpen && <TransformToolbar />}
        <div className="pointer-events-none absolute top-[30px] left-[clamp(20px,3vw,42px)] z-10"><span className="mb-2 block font-mono text-[0.68rem] font-bold tracking-[0.14em] text-accent uppercase">3D viewport</span><h2 className="text-[clamp(1.6rem,3vw,2.25rem)] font-medium tracking-[-0.04em]" id="scene-title">{fleetPreviewOpen ? `${activeScenario?.name ?? "Plan"} · ${selectedYear}` : "Model scene"}</h2>{fleetPreviewOpen && <p className="mt-2 text-xs text-[#39ff14]">Bright green vehicles are transitioned in the active scenario.</p>}</div>
        {fleetPreviewOpen && <button type="button" className="absolute top-7 right-6 z-10 min-h-10 rounded border border-line-strong bg-panel/90 px-3 text-xs font-bold text-primary hover:border-accent" onClick={() => setFleetPreviewOpen(false)}>Return to scene</button>}
        <div className="pointer-events-none absolute right-[clamp(20px,3vw,42px)] bottom-7 z-10 rounded-lg border border-line-strong/80 bg-surface/80 px-[11px] py-[9px] text-[0.7rem] text-secondary backdrop-blur-[10px]">{fleetPreviewOpen ? "Drag to orbit · Scroll zoom" : "Click to select · MMB orbit · Shift+MMB pan · Scroll zoom · W/E/R transform · Q space"}</div>
      </section>
      <Sidebar onResetCamera={() => setCameraReset((value) => value + 1)} onVisualizeFleet={() => setFleetPreviewOpen(true)} fleetPreviewOpen={fleetPreviewOpen} onCloseFleetPreview={() => setFleetPreviewOpen(false)} />
    </ResizableWorkspace>}
  </main>;
}
