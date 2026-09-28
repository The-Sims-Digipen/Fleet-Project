import { Component, lazy, Suspense, useMemo, useState, type ReactNode } from "react";
import { CompareWorkspace } from "./components/CompareWorkspace";
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
import { createFleetSceneObjects } from "./scene/fleetSceneObjects";

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
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("plan");
  const vehicles = useFleetStore((state) => state.vehicles);
  const selectedYear = useTimelineStore((state) => state.selectedYear);
  const presets = usePresetStore((state) => state.presets);
  const scenarios = useProjectStore((state) => state.scenarios);
  const activeScenarioId = useProjectStore((state) => state.activeScenarioId);
  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId) ?? scenarios[0];
  const fleetObjects = useMemo(() => createFleetSceneObjects({
    vehicles,
    presets,
    vehiclePlans: activeScenario?.document.vehiclePlans ?? {},
    year: selectedYear,
  }), [activeScenario, presets, selectedYear, vehicles]);

  return <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-surface">
    <a className="fixed top-3 left-3 z-50 -translate-y-[160%] rounded-lg bg-accent px-3.5 py-2.5 font-extrabold text-accent-ink focus:translate-y-0" href={workspaceMode === "compare" ? "#compare-workspace" : "#controls"}>Skip to workspace</a>
    <header className="flex h-14 shrink-0 items-center gap-2 overflow-x-auto border-b border-line bg-surface/95 px-4 [scrollbar-width:thin]">
      <ProjectControls />
      <div className="mx-1 h-6 w-px shrink-0 bg-line" aria-hidden="true" />
      <span className="shrink-0 px-1 text-[0.68rem] font-bold tracking-[0.12em] text-secondary uppercase">Mode</span>
      <div className="flex shrink-0 items-center gap-2" role="tablist" aria-label="Workspace view">
        <button type="button" role="tab" aria-selected={workspaceMode === "plan"} className={workspaceMode === "plan" ? topBarControlActive : topBarControl} onClick={() => setWorkspaceMode("plan")}>Plan / Depot</button>
        <button type="button" role="tab" aria-selected={workspaceMode === "compare"} className={workspaceMode === "compare" ? topBarControlActive : topBarControl} onClick={() => setWorkspaceMode("compare")}>Compare</button>
      </div>
      <div className="mx-1 h-6 w-px shrink-0 bg-line" aria-hidden="true" />
      {workspaceMode === "plan" && import.meta.env.DEV && <HistoryControls />}
      <span className={topBarStatus}><i className="size-[7px] shrink-0 rounded-full bg-accent shadow-[0_0_10px_#55d6be80]" aria-hidden="true" />Project environment</span>
    </header>

    {workspaceMode === "compare" ? <CompareWorkspace /> : <ResizableWorkspace>
      <section className="relative min-h-0 min-w-0 overflow-hidden bg-surface" aria-labelledby="scene-title">
        <ViewportBoundary><Suspense fallback={<div className="grid h-full place-items-center p-8 text-center text-secondary">Loading project environment…</div>}><LazyWorldScene cameraReset={cameraReset} fleetObjects={fleetObjects} /></Suspense></ViewportBoundary>
        {import.meta.env.DEV && <TransformToolbar />}
        <div className="pointer-events-none absolute top-[30px] left-[clamp(20px,3vw,42px)] z-10"><span className="mb-2 block font-mono text-[0.68rem] font-bold tracking-[0.14em] text-accent uppercase">3D viewport</span><h2 className="text-[clamp(1.6rem,3vw,2.25rem)] font-medium tracking-[-0.04em]" id="scene-title">{activeScenario?.name ?? "Project depot"} · {selectedYear}</h2><p className="mt-2 text-xs text-[#39ff14]">Bright green vehicles have transitioned in the active scenario.</p></div>
        <div className="pointer-events-none absolute right-[clamp(20px,3vw,42px)] bottom-7 z-10 rounded-lg border border-line-strong/80 bg-surface/80 px-[11px] py-[9px] text-[0.7rem] text-secondary backdrop-blur-[10px]">MMB orbit · Shift+MMB pan · Scroll zoom{import.meta.env.DEV ? " · Click to select · W/E/R transform · Q space" : ""}</div>
      </section>
      <Sidebar onResetCamera={() => setCameraReset((value) => value + 1)} />
    </ResizableWorkspace>}
  </main>;
}
