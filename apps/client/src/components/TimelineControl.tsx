import { useEffect, useState } from "react";
import { CollapsibleSection } from "./CollapsibleSection";
import { END_YEAR, START_YEAR, useTimelineStore } from "../state/timelineStore";
import { useFleetStore } from "../state/fleetStore";

const chargerEvents = [
  { year: 2029, kind: "charger", label: "Depot charger installation" },
  { year: 2033, kind: "charger", label: "Additional charger installation" },
] as const;

const buttonClass = "min-h-9 rounded-lg border border-line-strong px-3 text-xs font-bold text-secondary hover:border-[#668078] hover:text-primary";

export function TimelineControl() {
  const selectedYear = useTimelineStore((state) => state.selectedYear);
  const setSelectedYear = useTimelineStore((state) => state.setSelectedYear);
  const resetYear = useTimelineStore((state) => state.resetYear);
  const vehicles = useFleetStore((state) => state.vehicles);
  const [playing, setPlaying] = useState(false);
  const vehicleEvents = vehicles.filter((vehicle) => vehicle.plannedTransitionYear !== null).map((vehicle) => ({
    year: vehicle.plannedTransitionYear!, kind: "vehicle" as const, label: `${vehicle.vehicleId} vehicle change`,
  }));
  const events = [...vehicleEvents, ...chargerEvents].sort((a, b) => a.year - b.year);
  const vehicleYears = [...new Set(vehicleEvents.map((event) => event.year))];

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const timeline = useTimelineStore.getState();
      if (timeline.selectedYear >= END_YEAR) setPlaying(false);
      else timeline.setSelectedYear(timeline.selectedYear + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing]);

  return <CollapsibleSection title="Timeline" defaultOpen description="Vehicle changes follow the years chosen in Fleet Management. Charger events are sample data.">
    <div className="flex items-center justify-between gap-3">
      <label htmlFor="timeline-year" className="text-xs font-semibold text-secondary">Selected year</label>
      <output htmlFor="timeline-year" className="font-mono text-xl font-bold text-accent">{selectedYear}</output>
    </div>
    <input id="timeline-year" type="range" min={START_YEAR} max={END_YEAR} step={1} value={selectedYear}
      onChange={(event) => setSelectedYear(Number(event.target.value))} className="mt-4 w-full cursor-pointer accent-accent" />
    <div className="relative mx-1 mt-1 h-8" aria-label="Transition markers">
      {vehicleYears.map((year) => <button key={`vehicle-${year}`} type="button"
        aria-label={`${year}: ${vehicleEvents.filter((event) => event.year === year).length} vehicle changes`}
        title={`${year}: ${vehicleEvents.filter((event) => event.year === year).map((event) => event.label).join(", ")}`}
        onClick={() => setSelectedYear(year)}
        className="absolute top-0 size-3 -translate-x-1/2 rounded-full bg-accent"
        style={{ left: `${(year - START_YEAR) / (END_YEAR - START_YEAR) * 100}%` }} />)}
      {chargerEvents.map((event) => <button key={`charger-${event.year}`} type="button"
        aria-label={`${event.year}: ${event.label}`} title={`${event.year}: ${event.label}`}
        onClick={() => setSelectedYear(event.year)}
        className="absolute top-4 size-3 -translate-x-1/2 rounded-full bg-[#e6b966]"
        style={{ left: `${(event.year - START_YEAR) / (END_YEAR - START_YEAR) * 100}%` }} />)}
    </div>
    <div className="flex justify-between font-mono text-[0.7rem] text-secondary"><span>{START_YEAR}</span><span>{END_YEAR}</span></div>
    <div className="mt-3 flex flex-wrap gap-3 text-[0.72rem] text-secondary">
      <span><span aria-hidden="true" className="mr-1.5 inline-block size-2 rounded-full bg-accent" />Vehicle replacement</span>
      <span><span aria-hidden="true" className="mr-1.5 inline-block size-2 rounded-full bg-[#e6b966]" />Charger installation</span>
    </div>
    <div className="mt-5 flex gap-2">
      <button type="button" className={buttonClass} onClick={() => {
        if (!playing && selectedYear === END_YEAR) resetYear();
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
