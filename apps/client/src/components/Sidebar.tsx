import { CostAnalysis } from "./CostAnalysis";
import { AudioDemoPanel } from "./AudioDemoPanel";
import { DebugPanel, InspectorPanel, ScenePanel } from "./EditorPanels";
import { FleetManagementPanel } from "./FleetManagementPanel";
import { PowerFeasibility } from "./PowerFeasibility";
import { ScenarioPanel } from "./ScenarioPanel";
import { SimulationSettings } from "./SimulationSettings";
import { TimelineControl } from "./TimelineControl";
import { VehiclePresets } from "./VehiclePresets";

export function Sidebar() {
  return <aside className="col-start-3 row-start-1 flex min-h-0 min-w-0 flex-col overflow-y-auto overscroll-contain bg-panel p-7 *:shrink-0 max-[900px]:col-start-1 max-[900px]:row-start-3 max-[560px]:px-5 max-[560px]:py-6" id="controls" aria-labelledby="controls-title" tabIndex={-1}>
    <ScenarioPanel />
    <FleetManagementPanel />
    <TimelineControl />
    <VehiclePresets />
    <SimulationSettings />
    {import.meta.env.DEV && <InspectorPanel />}
    <PowerFeasibility />
    {import.meta.env.DEV && <ScenePanel />}
    <CostAnalysis />
    <AudioDemoPanel />
    {import.meta.env.DEV && <DebugPanel />}
  </aside>;
}
