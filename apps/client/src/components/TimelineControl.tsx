import { useEffect, useState } from "react";
import { CollapsibleSection } from "./CollapsibleSection";
import { analysisEndYear } from "../domain/contracts";
import { transitionEvents } from "../domain/effectiveState";
import { useFleetStore, useFleetVehicles } from "../state/fleetStore";
import { usePresetStore } from "../state/presetStore";
import { useProjectStore } from "../state/projectStore";
import { useTimelineStore } from "../state/timelineStore";

const chargerEvents = [
  { year: 2029, kind: "charger", label: "Depot charger installation" },
  { year: 2033, kind: "charger", label: "Additional charger installation" },
] as const;

const buttonClass = "min-h-9 rounded-lg border border-line-strong px-3 text-xs font-bold text-secondary hover:border-[#668078] hover:text-primary";

export function TimelineControl() {
  const selectedYear = useTimelineStore((state) => state.selectedYear);
  const setSelectedYear = useTimelineStore((state) => state.setSelectedYear);
  const resetYear = useTimelineStore((state) => state.resetYear);
  const vehicles = useFleetVehicles();
  const analysis = useFleetStore((state) => state.analysis);
  const presets = usePresetStore((state) => state.presets);
  const scenarios = useProjectStore((state) => state.scenarios);
  const activeScenarioId = useProjectStore((state) => state.activeScenarioId);
  const scenario = scenarios.find((item) => item.id === activeScenarioId) ?? scenarios[0];
  const [playing, setPlaying] = useState(false);

  const startYear = analysis.startYear;
  const endYear = analysisEndYear(analysis);
  // Vehicle markers are the scenario's real transitions, projected by T03.
  const vehicleEvents = scenario
    ? transitionEvents(vehicles, scenario.document.vehiclePlans, new Set(presets.map((preset) => preset.id)), analysis)
      .map((event) => ({ year: event.year, kind: "vehicle" as const, label: `${event.vehicleId} vehicle change` }))
    : [];
  const events = [...vehicleEvents, ...chargerEvents].sort((a, b) => a.year - b.year);
  const vehicleYears = [...new Set(vehicleEvents.map((event) => event.year))];
  const offset = (year: number) => endYear === startYear ? 0 : (year - startYear) / (endYear - startYear) * 100;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const timeline = useTimelineStore.getState();
      if (timeline.selectedYear >= endYear) setPlaying(false);
      else timeline.setSelectedYear(timeline.selectedYear + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [endYear, playing]);

  return <CollapsibleSection title="Timeline" defaultOpen description="Vehicle changes follow the active scenario. Charger events are sample data.">
    <div className="flex items-center justify-between gap-3">
      <label htmlFor="timeline-year" className="text-xs font-semibold text-secondary">Selected year</label>
      <output htmlFor="timeline-year" className="font-mono text-xl font-bold text-accent">{selectedYear}</output>
    </div>
    <input id="timeline-year" type="range" min={startYear} max={endYear} step={1} value={selectedYear}
      onChange={(event) => setSelectedYear(Number(event.target.value))} className="mt-4 w-full cursor-pointer accent-accent" />
    <div className="relative mx-1 mt-1 h-8" aria-label="Transition markers">
      {vehicleYears.map((year) => <button key={`vehicle-${year}`} type="button"
        aria-label={`${year}: ${vehicleEvents.filter((event) => event.year === year).length} vehicle changes`}
        title={`${year}: ${vehicleEvents.filter((event) => event.year === year).map((event) => event.label).join(", ")}`}
        onClick={() => setSelectedYear(year)}
        className="absolute top-0 size-3 -translate-x-1/2 rounded-full bg-accent"
        style={{ left: `${offset(year)}%` }} />)}
      {chargerEvents.map((event) => <button key={`charger-${event.year}`} type="button"
        aria-label={`${event.year}: ${event.label}`} title={`${event.year}: ${event.label}`}
        onClick={() => setSelectedYear(event.year)}
        className="absolute top-4 size-3 -translate-x-1/2 rounded-full bg-[#e6b966]"
        style={{ left: `${offset(event.year)}%` }} />)}
    </div>
    <div className="flex justify-between font-mono text-[0.7rem] text-secondary"><span>{startYear}</span><span>{endYear}</span></div>
    <div className="mt-3 flex flex-wrap gap-3 text-[0.72rem] text-secondary">
      <span><span aria-hidden="true" className="mr-1.5 inline-block size-2 rounded-full bg-accent" />Vehicle replacement</span>
      <span><span aria-hidden="true" className="mr-1.5 inline-block size-2 rounded-full bg-[#e6b966]" />Charger installation</span>
    </div>
    <div className="mt-5 flex gap-2">
      <button type="button" className={buttonClass} onClick={() => {
        if (!playing && selectedYear === endYear) resetYear();
        setPlaying(!playing);
      }}>{playing ? "Pause" : "Play"}</button>
      <button type="button" className={buttonClass} onClick={() => { setPlaying(false); resetYear(); }}>Reset</button>
    </div>
    <ul aria-label="Transition events" className="mt-5 space-y-1 text-xs text-secondary">
      {events.map((event) => <li key={`${event.kind}-${event.year}-${event.label}`} className={event.year === selectedYear ? "font-semibold text-primary" : ""}>
        <span className="mr-2 font-mono text-accent">{event.year}</span>{event.label}
      </li>)}
    </ul>
  </CollapsibleSection>;
}
