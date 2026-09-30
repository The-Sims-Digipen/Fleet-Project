import { CollapsibleSection } from "./CollapsibleSection";
import { useProjectStore } from "../state/projectStore";
import { useTimelinePlayback } from "./useTimelinePlayback";

const buttonClass = "min-h-9 rounded-lg border border-line-strong px-3 text-xs font-bold text-secondary hover:border-[#668078] hover:text-primary";
const getPlanSelectedYear = () => useProjectStore.getState().runtime.editor.plan.selectedYear;

export function TimelineControl() {
  const document = useProjectStore((state) => state.runtime.document);
  const selectedYear = useProjectStore((state) => state.runtime.editor.plan.selectedYear);
  const playing = useProjectStore((state) => state.runtime.editor.plan.playing);
  const setSelectedYear = useProjectStore((state) => state.setPlanSelectedYear);
  const resetYear = useProjectStore((state) => state.resetPlanSelectedYear);
  const setPlaying = useProjectStore((state) => state.setPlanPlaying);
  const { analysis, scenarios, activeScenarioId } = document;
  const scenario = scenarios.find((item) => item.id === activeScenarioId) ?? scenarios[0];
  const startYear = analysis.startYear;
  const endYear = analysis.startYear + analysis.yearCount - 1;
  const vehicleEvents = scenario
    ? Object.entries(scenario.vehiclePlans).flatMap(([vehicleId, plan]) => plan.transitions.map((transition) => ({
      year: transition.year,
      vehicleId,
      vehicleName: document.environment.vehicles.find((vehicle) => vehicle.id === vehicleId)?.name ?? vehicleId,
    }))).filter((event) => event.year >= startYear && event.year <= endYear)
    : [];
  const vehicleYears = [...new Set(vehicleEvents.map((event) => event.year))];
  const offset = (year: number) => endYear === startYear ? 0 : (year - startYear) / (endYear - startYear) * 100;

  useTimelinePlayback({ playing, endYear, getSelectedYear: getPlanSelectedYear, setSelectedYear, setPlaying });

  return <CollapsibleSection panelId="timeline" title="Timeline" description="Vehicle changes follow the active Scenario.">
    <div className="flex items-center justify-between gap-3">
      <label htmlFor="timeline-year" className="text-xs font-semibold text-secondary">Selected year</label>
      <output htmlFor="timeline-year" className="font-mono text-xl font-bold text-accent">{selectedYear}</output>
    </div>
    <input id="timeline-year" type="range" min={startYear} max={endYear} step={1} value={selectedYear}
      onChange={(event) => setSelectedYear(Number(event.target.value))} className="mt-4 w-full cursor-pointer accent-accent" />
    <div className="relative mx-1 mt-1 h-8" aria-label="Transition markers">
      {vehicleYears.map((year) => <button key={`vehicle-${year}`} type="button"
        aria-label={`${year}: ${vehicleEvents.filter((event) => event.year === year).length} vehicle changes`}
        title={`${year}: ${vehicleEvents.filter((event) => event.year === year).map((event) => event.vehicleName).join(", ")}`}
        onClick={() => setSelectedYear(year)}
        className="absolute top-0 size-3 -translate-x-1/2 rounded-full bg-accent"
        style={{ left: `${offset(year)}%` }} />)}
    </div>
    <div className="flex justify-between font-mono text-[0.7rem] text-secondary"><span>{startYear}</span><span>{endYear}</span></div>
    <div className="mt-3 flex flex-wrap gap-3 text-[0.72rem] text-secondary">
      <span><span aria-hidden="true" className="mr-1.5 inline-block size-2 rounded-full bg-accent" />Vehicle transition</span>
    </div>
    <div className="mt-5 flex gap-2">
      <button type="button" className={buttonClass} onClick={() => {
        if (!playing && selectedYear === endYear) resetYear();
        setPlaying(!playing);
      }}>{playing ? "Pause" : "Play"}</button>
      <button type="button" className={buttonClass} onClick={() => { setPlaying(false); resetYear(); }}>Reset</button>
    </div>
    <ul aria-label="Transition events" className="mt-5 space-y-1 text-xs text-secondary">
      {vehicleYears.map((year) => <li key={`vehicle-${year}`} className={year === selectedYear ? "font-semibold text-primary" : ""}>
        <span className="mr-2 font-mono text-accent">{year}</span>{vehicleEvents.filter((event) => event.year === year).map((event) => event.vehicleName).join(", ")}
      </li>)}
    </ul>
  </CollapsibleSection>;
}
