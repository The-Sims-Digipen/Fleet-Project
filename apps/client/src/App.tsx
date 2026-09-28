import { Component, lazy, Suspense, useMemo, useState, type ReactNode } from "react";
import { CompareWorkspace } from "./components/CompareWorkspace";
import { effectiveVehicleState } from "./domain/effectiveState";
import { createObject } from "./scene/catalog";
import type { SceneObject } from "./scene/types";
import { HistoryControls } from "./components/HistoryControls";
import { ProjectControls } from "./components/ProjectControls";
import { ResizableWorkspace } from "./components/ResizableWorkspace";
import { Sidebar } from "./components/Sidebar";
import { TransformToolbar } from "./components/TransformToolbar";
import { topBarControl, topBarControlActive, topBarStatus } from "./components/topBarStyles";
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
  // The 3D preview asks T03 what each vehicle is in the selected year rather
  // than reimplementing the transition rule.
  const previewObjects: SceneObject[] | null = useMemo(() => {
    if (!fleetPreviewOpen || !activeScenario) return null;
    const presetIds = new Set(presets.map((preset) => preset.id));
    return vehicles.flatMap((vehicle, index) => {
      const state = effectiveVehicleState(vehicle, activeScenario.document.vehiclePlans[vehicle.id], presetIds, selectedYear);
      const preset = presets.find((item) => item.id === state.presetId);
      if (!preset) return [];
      const object = createObject(preset.modelId || "van", `fleet-preview-${vehicle.id}`, preset.id, `${vehicle.id} · ${vehicle.name}${state.transitioned ? " · Changed" : ""}`);
      if (!object) return [];
      object.transform.position = [(index - (vehicles.length - 1) / 2) * 4.5, 0, 0];
      object.appearance = { tint: state.transitioned ? "#39ff14" : preset.propulsion === "electric" ? "#85d8ff" : preset.propulsion === "hybrid" ? "#f5d18a" : "#ffffff" };
      return [object];
    });
  }, [activeScenario, fleetPreviewOpen, presets, selectedYear, vehicles]);

  return <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-surface">
    <a className="fixed top-3 left-3 z-50 -translate-y-[160%] rounded-lg bg-accent px-3.5 py-2.5 font-extrabold text-accent-ink focus:translate-y-0" href={workspaceMode === "compare" ? "#compare-workspace" : "#controls"}>Skip to workspace</a>
    <header className="flex h-14 shrink-0 items-center gap-2 overflow-x-auto border-b border-line bg-surface/95 px-4 [scrollbar-width:thin]">
      <ProjectControls />
      <div className="mx-1 h-6 w-px shrink-0 bg-line" aria-hidden="true" />
      <span className="shrink-0 px-1 text-[0.68rem] font-bold tracking-[0.12em] text-secondary uppercase">Mode</span>
      <div className="flex shrink-0 items-center gap-2" role="tablist" aria-label="Workspace view">
        <button type="button" role="tab" aria-selected={workspaceMode === "plan"} className={workspaceMode === "plan" ? topBarControlActive : topBarControl} onClick={() => setWorkspaceMode("plan")}>Plan / Depot</button>
        <button type="button" role="tab" aria-selected={workspaceMode === "compare"} className={workspaceMode === "compare" ? topBarControlActive : topBarControl} onClick={() => { setFleetPreviewOpen(false); setWorkspaceMode("compare"); }}>Compare</button>
      </div>
      <div className="mx-1 h-6 w-px shrink-0 bg-line" aria-hidden="true" />
      {workspaceMode === "plan" && <HistoryControls />}
      <span className={topBarStatus}><i className="size-[7px] shrink-0 rounded-full bg-accent shadow-[0_0_10px_#55d6be80]" aria-hidden="true" />Shared world</span>
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
