import ReactECharts from "echarts-for-react";
import { useMemo, useState } from "react";

import type { ProjectDocument, ProjectScenario } from "../domain/project";
import { simulateProject, type ScenarioSimulation } from "../domain/simulation";
import { useProjectStore } from "../state/projectStore";
import { ComparisonViewport } from "./ComparisonViewport";
import { useTimelinePlayback } from "./useTimelinePlayback";

const number = new Intl.NumberFormat("en-SG", { maximumFractionDigits: 0 });
const fieldClass = "min-h-9 w-full min-w-0 rounded border border-line-strong bg-control px-2 text-xs font-medium text-primary focus:border-accent";
const actionClass = "min-h-8 rounded border border-line-strong px-2.5 text-xs font-semibold text-secondary hover:border-accent hover:text-primary disabled:cursor-default disabled:opacity-40";
const labelClass = "grid min-w-0 gap-1 text-[10px] font-semibold text-secondary";

type PlanSlot = "A" | "B";
const getCompareSelectedYear = () => useProjectStore.getState().runtime.editor.compare.selectedYear;

function analysisYears(document: ProjectDocument): number[] {
  return Array.from({ length: document.analysis.yearCount }, (_, index) => document.analysis.startYear + index);
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="rounded-lg border border-line bg-control px-3 py-3">
    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-secondary">{label}</p>
    <p className="mt-1 text-lg font-semibold text-primary">{value}</p>
    {detail && <p className="mt-1 text-[11px] leading-relaxed text-secondary">{detail}</p>}
  </div>;
}

function ScenarioPicker({ slot, scenario, scenarios, otherScenarioId, onChange }: {
  slot: PlanSlot;
  scenario: ProjectScenario | null;
  scenarios: readonly ProjectScenario[];
  otherScenarioId: string | null;
  onChange: (scenarioId: string) => void;
}) {
  return <label className={`${labelClass} w-48`}>
    Scenario for Plan {slot}
    <select aria-label={`Scenario for Plan ${slot}`} className={fieldClass} value={scenario?.id ?? ""} disabled={!scenario}
      onChange={(event) => onChange(event.target.value)}>
      {!scenario && <option value="">No Scenario available</option>}
      {scenarios.map((entry) => <option key={entry.id} value={entry.id} disabled={entry.id === otherScenarioId}>
        {entry.name}
      </option>)}
    </select>
  </label>;
}

function PlanColumn({ slot, scenario, scenarios, otherScenarioId, document, simulation, selectedYear, formatCurrency, onSelectScenario }: {
  slot: PlanSlot;
  scenario: ProjectScenario | null;
  scenarios: readonly ProjectScenario[];
  otherScenarioId: string | null;
  document: ProjectDocument;
  simulation: ReturnType<typeof simulateProject>;
  selectedYear: number;
  formatCurrency: (value: number) => string;
  onSelectScenario: (scenarioId: string) => void;
}) {
  const [cameraReset, setCameraReset] = useState(0);
  const result: ScenarioSimulation | undefined = scenario ? simulation.scenarios[scenario.id] : undefined;
  const annual = result?.annual.find((entry) => entry.year === selectedYear);
  const title = scenario?.name ?? `Plan ${slot}`;

  return <article className="min-w-[520px] flex-1 overflow-hidden rounded-xl border border-line-strong bg-panel shadow-[0_18px_70px_rgba(0,0,0,0.18)]">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-4 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-accent">Plan {slot}</p>
          <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-secondary">{selectedYear} view</span>
        </div>
        <h3 className="mt-1 truncate text-xl font-semibold" title={title}>{scenario?.name ?? "No Scenario selected"}</h3>
        <p className="mt-1 text-xs leading-relaxed text-secondary">Project environment and assumptions are shared with Plan {slot === "A" ? "B" : "A"}.</p>
      </div>
      <button type="button" aria-label={`Reset Plan ${slot} camera`} className={actionClass} onClick={() => setCameraReset((value) => value + 1)}>Reset view</button>
      <ScenarioPicker slot={slot} scenario={scenario} scenarios={scenarios} otherScenarioId={otherScenarioId} onChange={onSelectScenario} />
    </div>

    <div className="relative h-[350px] border-b border-line bg-surface">
      <ComparisonViewport document={document} scenarioId={scenario?.id ?? null} year={selectedYear} reset={cameraReset} />
      <div className="pointer-events-none absolute left-3 top-3 flex gap-2">
        <span className="rounded border border-line-strong bg-panel/90 px-2 py-1 font-mono text-[10px] text-secondary backdrop-blur">Shared Project environment</span>
        <span className="rounded border border-line-strong bg-panel/90 px-2 py-1 font-mono text-[10px] text-secondary backdrop-blur">{document.environment.vehicles.length} Vehicles</span>
      </div>
    </div>

    {!scenario ? <p role="status" className="p-4 text-xs text-secondary">{scenarios.length === 1
      ? "This Project has one Scenario. Create or duplicate another Scenario in Plan / Depot to compare alternatives."
      : "Choose an available Scenario to compare its results."}</p>
      : !result ? <p role="status" className="p-4 text-xs text-secondary">Results are unavailable for {scenario.name}.</p>
        : <>
          <div role="group" aria-label={`Plan ${slot} results`} className="grid grid-cols-2 gap-2 p-4">
            <Metric label="TCO" value={formatCurrency(result.totals.tco)} detail={`${document.analysis.yearCount}-year Project cost`} />
            <Metric label="Transition CAPEX" value={formatCurrency(result.totals.transitionCapex)} detail="Vehicle acquisitions for planned transitions" />
            <Metric label="Total transitions" value={number.format(result.totals.transitionCount)} detail="Across the analysis period" />
            <Metric label="Payback year" value={result.paybackYear === null ? "Not reached" : String(result.paybackYear)} detail={result.paybackStatus === "initial-parity" ? "No upfront premium; cash savings stay nonnegative." : result.paybackStatus === "reached" ? "Cumulative cash savings remain nonnegative." : "Cash savings do not remain nonnegative through the analysis period."} />
            <Metric label={`${selectedYear} net cash cost`} value={formatCurrency(annual?.netCashCost ?? 0)} detail="Derived annual Scenario cost" />
            <Metric label={`${selectedYear} emissions`} value={`${number.format(annual?.emissionsKgCo2e ?? 0)} kg CO₂e`} detail="From the effective Vehicle Presets" />
            <Metric label={`${selectedYear} transitions`} value={number.format(annual?.transitionCount ?? 0)} detail="Vehicles changing state this year" />
          </div>
        </>}
  </article>;
}

function Delta({ label, planA, planB, format }: {
  label: string;
  planA: number | null;
  planB: number | null;
  format: (value: number) => string;
}) {
  if (planA === null || planB === null) return <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line py-3 last:border-b-0">
    <p className="text-sm font-semibold text-primary">{label}</p><span className="text-sm text-secondary">Unavailable</span>
  </div>;
  const delta = planB - planA;
  return <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line py-3 last:border-b-0">
    <div><p className="text-sm font-semibold text-primary">{label}</p><p className="mt-0.5 text-[11px] text-secondary">Plan B compared with Plan A</p></div>
    <span className="font-mono text-sm font-semibold tabular-nums text-primary">{delta === 0 ? "No change" : `${delta > 0 ? "+" : "−"}${format(Math.abs(delta))}`}</span>
  </div>;
}

function PaybackDelta({ planA, planB }: {
  planA: ScenarioSimulation | undefined;
  planB: ScenarioSimulation | undefined;
}) {
  let value = "Unavailable";
  if (planA && planB) {
    if (planA.paybackYear === null && planB.paybackYear === null) value = "Not reached in either Scenario";
    else if (planA.paybackYear === null) value = `Plan A not reached; Plan B: ${planB.paybackYear}`;
    else if (planB.paybackYear === null) value = `Plan A: ${planA.paybackYear}; Plan B not reached`;
    else {
      const difference = planB.paybackYear - planA.paybackYear;
      value = difference === 0 ? "Same year" : `${Math.abs(difference)} ${Math.abs(difference) === 1 ? "year" : "years"} ${difference > 0 ? "later" : "earlier"}`;
    }
  }

  return <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line py-3 last:border-b-0">
    <div><p className="text-sm font-semibold text-primary">Payback year</p><p className="mt-0.5 text-[11px] text-secondary">Plan B compared with Plan A</p></div>
    <span className="font-mono text-sm font-semibold tabular-nums text-primary">{value}</span>
  </div>;
}

function TimelineScrubber({ years, selectedYear, playing, setSelectedYear, setPlaying }: {
  years: readonly number[];
  selectedYear: number;
  playing: boolean;
  setSelectedYear: (year: number) => void;
  setPlaying: (playing: boolean) => void;
}) {
  const startYear = years[0] ?? selectedYear;
  const endYear = years[years.length - 1] ?? selectedYear;

  useTimelinePlayback({ playing, endYear, getSelectedYear: getCompareSelectedYear, setSelectedYear, setPlaying });

  return <article className="rounded-xl border border-line-strong bg-panel px-5 py-4">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Shared timeline</p>
        <h3 className="mt-1 text-lg font-semibold">Scrub both Scenarios together</h3>
        <p className="mt-1 text-xs text-secondary">Both Project views and derived results use this comparison year.</p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className={actionClass} onClick={() => {
          if (!playing && selectedYear === endYear) setSelectedYear(startYear);
          setPlaying(!playing);
        }}>{playing ? "Pause" : "Play"}</button>
        <button type="button" className={actionClass} onClick={() => { setPlaying(false); setSelectedYear(startYear); }}>Reset</button>
        <output htmlFor="comparison-year" className="min-w-[74px] rounded-lg border border-line bg-control px-3 py-2 text-center font-mono text-lg font-semibold text-primary">{selectedYear}</output>
      </div>
    </div>
    <div className="mt-5">
      <input id="comparison-year" aria-label="Comparison year" type="range" min={startYear} max={endYear} step={1} value={selectedYear}
        onChange={(event) => { setPlaying(false); setSelectedYear(Number(event.target.value)); }} className="w-full cursor-pointer accent-accent" />
      <div className="mt-2 grid font-mono text-[10px] text-secondary" style={{ gridTemplateColumns: `repeat(${years.length}, minmax(0, 1fr))` }}>
        {years.map((year) => <button key={year} type="button" onClick={() => { setPlaying(false); setSelectedYear(year); }} className={`text-center hover:text-primary ${year === selectedYear ? "font-bold text-accent" : ""}`}>{year}</button>)}
      </div>
    </div>
  </article>;
}

export function CompareWorkspace() {
  const document = useProjectStore((state) => state.runtime.document);
  const comparison = useProjectStore((state) => state.runtime.editor.compare);
  const setCompareScenario = useProjectStore((state) => state.setCompareScenario);
  const setSelectedYear = useProjectStore((state) => state.setCompareSelectedYear);
  const setPlaying = useProjectStore((state) => state.setComparePlaying);
  const scenarios = document.scenarios;
  const years = analysisYears(document);
  const selectedYear = comparison.selectedYear;

  const scenarioA = scenarios.find((scenario) => scenario.id === comparison.scenarioAId) ?? scenarios[0] ?? null;
  const scenarioB = scenarios.find((scenario) => scenario.id === comparison.scenarioBId && scenario.id !== scenarioA?.id)
    ?? scenarios.find((scenario) => scenario.id !== scenarioA?.id) ?? null;
  const simulation = useMemo(() => simulateProject(document), [document]);
  const formatCurrency = useMemo(() => {
    const formatter = new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: document.analysis.currency,
      maximumFractionDigits: 0,
    });
    return (value: number) => formatter.format(value);
  }, [document.analysis.currency]);
  const resultA = scenarioA ? simulation.scenarios[scenarioA.id] : undefined;
  const resultB = scenarioB ? simulation.scenarios[scenarioB.id] : undefined;
  const annualA = resultA?.annual.find((entry) => entry.year === selectedYear);
  const annualB = resultB?.annual.find((entry) => entry.year === selectedYear);
  const comparisonRows: Array<{ scenario: ProjectScenario | null; result: ScenarioSimulation | undefined }> = [
    { scenario: scenarioA, result: resultA },
    { scenario: scenarioB, result: resultB },
  ];

  const setScenario = (slot: PlanSlot, id: string) => setCompareScenario(slot, id);

  const chartOption = useMemo(() => ({
    animation: false,
    tooltip: { trigger: "axis", valueFormatter: (value: number) => formatCurrency(value) },
    legend: { show: false },
    grid: { left: 68, right: 22, top: 18, bottom: 52, containLabel: true },
    xAxis: {
      type: "category",
      data: simulation.years,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#405a53" } },
      axisTick: { alignWithLabel: true },
      axisLabel: { color: "#b1c3bd", margin: 14, hideOverlap: true },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#b1c3bd", formatter: (value: number | string) => formatCurrency(Number(value)), margin: 10 },
      splitLine: { lineStyle: { color: "#273a35" } },
    },
    series: [
      {
        name: scenarioA?.name ?? "Plan A",
        type: "line",
        smooth: false,
        symbolSize: 6,
        data: resultA?.annual.map((row) => row.cumulativeCashCost) ?? [],
        lineStyle: { width: 3, color: "#4f7cff" },
        itemStyle: { color: "#4f7cff" },
        markLine: {
          silent: true,
          symbol: ["none", "none"],
          label: { show: false },
          lineStyle: { color: "#7d938c", type: "dashed", width: 1 },
          data: [{ xAxis: selectedYear }],
        },
      },
      {
        name: scenarioB?.name ?? "Plan B",
        type: "line",
        smooth: false,
        symbolSize: 6,
        data: resultB?.annual.map((row) => row.cumulativeCashCost) ?? [],
        lineStyle: { width: 3, color: "#d8ff28" },
        itemStyle: { color: "#d8ff28" },
      },
    ],
  }), [formatCurrency, resultA, resultB, scenarioA?.name, scenarioB?.name, selectedYear, simulation.years]);

  if (!scenarios.length) return <section id="compare-workspace" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto bg-surface px-[clamp(16px,2.5vw,34px)] py-5">
    <p role="status" className="mx-auto max-w-4xl rounded-xl border border-line-strong bg-panel p-6 text-sm text-secondary">This Project has no Scenarios to compare.</p>
  </section>;

  return <section id="compare-workspace" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto bg-surface px-[clamp(16px,2.5vw,34px)] py-5">
    <div className="mx-auto grid w-full max-w-[1680px] gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-line-strong bg-panel px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Scenario comparison</p>
            <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-secondary">Project data</span>
          </div>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.025em]">Compare Project Scenarios</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-secondary">Both plans use the same Project environment, baseline Vehicles, Vehicle Presets, and shared Analysis Settings. Compare their Scenario decisions over one year.</p>
        </div>
        <div className="rounded-lg border border-line bg-control px-4 py-3 text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-secondary">Selected year</p>
          <p className="mt-0.5 font-mono text-xl font-semibold text-primary">{selectedYear}</p>
        </div>
      </header>

      <TimelineScrubber years={years} selectedYear={selectedYear} playing={comparison.playing}
        setSelectedYear={setSelectedYear} setPlaying={setPlaying} />

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-4 xl:min-w-0">
          <PlanColumn slot="A" scenario={scenarioA} scenarios={scenarios} otherScenarioId={scenarioB?.id ?? null}
            document={document} simulation={simulation} selectedYear={selectedYear} formatCurrency={formatCurrency}
            onSelectScenario={(id) => setScenario("A", id)} />
          <PlanColumn slot="B" scenario={scenarioB} scenarios={scenarios} otherScenarioId={scenarioA?.id ?? null}
            document={document} simulation={simulation} selectedYear={selectedYear} formatCurrency={formatCurrency}
            onSelectScenario={(id) => setScenario("B", id)} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-xl border border-line-strong bg-panel p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Difference</p>
          <h3 className="mt-1 text-lg font-semibold">Plan B minus Plan A</h3>
          <p className="mt-1 text-xs text-secondary">Values use derived results for the selected Scenarios and shared Project assumptions.</p>
          <div className="mt-4">
            <Delta label="TCO" planA={resultA?.totals.tco ?? null} planB={resultB?.totals.tco ?? null} format={formatCurrency} />
            <Delta label="Transition CAPEX" planA={resultA?.totals.transitionCapex ?? null} planB={resultB?.totals.transitionCapex ?? null} format={formatCurrency} />
            <PaybackDelta planA={resultA} planB={resultB} />
            <Delta label="Total transitions" planA={resultA?.totals.transitionCount ?? null} planB={resultB?.totals.transitionCount ?? null}
              format={(value) => number.format(value)} />
            <Delta label={`${selectedYear} net cash cost`} planA={annualA?.netCashCost ?? null} planB={annualB?.netCashCost ?? null} format={formatCurrency} />
            <Delta label={`${selectedYear} emissions`} planA={annualA?.emissionsKgCo2e ?? null} planB={annualB?.emissionsKgCo2e ?? null}
              format={(value) => `${number.format(value)} kg CO₂e`} />
            <Delta label={`${selectedYear} transitions`} planA={annualA?.transitionCount ?? null} planB={annualB?.transitionCount ?? null}
              format={(value) => number.format(value)} />
          </div>
        </article>

        <article className="rounded-xl border border-line-strong bg-panel p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Cost over time</p>
          <h3 className="mt-1 text-lg font-semibold">Cumulative Project cost</h3>
          <p className="mt-1 text-xs text-secondary">Each series is the cumulative cash cost from its derived Scenario simulation.</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-secondary" aria-label="Cost chart legend">
            <span className="flex items-center gap-2"><i className="h-0.5 w-6 rounded bg-[#4f7cff]" />{scenarioA?.name ?? "Plan A"}</span>
            <span className="flex items-center gap-2"><i className="h-0.5 w-6 rounded bg-[#d8ff28]" />{scenarioB?.name ?? "Plan B"}</span>
            <span className="flex items-center gap-2"><i className="h-0 w-6 border-t border-dashed border-[#7d938c]" />Selected year: {selectedYear}</span>
          </div>
          <div className="mt-2 h-[330px]" role="img" aria-label="Cumulative cost comparison">
            <ReactECharts option={chartOption} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate opts={{ renderer: "svg" }} />
          </div>
        </article>
      </div>

      <article className="rounded-xl border border-line-strong bg-panel p-5">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Transition timeline</p>
          <h3 className="mt-1 text-lg font-semibold">Vehicles transitioning each year</h3>
          <p className="mt-1 text-xs text-secondary">Counts come from each Scenario's derived annual simulation results.</p>
        </div>
        {!resultA && !resultB ? <p role="status" className="mt-4 text-xs text-secondary">No Scenario results are available for this Project.</p>
          : <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-xs">
              <thead><tr><th className="border-b border-line p-2 text-left text-secondary">Scenario</th>{simulation.years.map((year) => <th key={year} className={`border-b border-line p-2 text-center ${year === selectedYear ? "bg-control text-accent" : "text-secondary"}`}>{year}</th>)}</tr></thead>
              <tbody>
                {comparisonRows.map(({ scenario, result }, index) => {
                  if (!scenario || !result) return <tr key={`empty-${index}`}><th className="border-b border-line p-2 text-left text-secondary">{index === 0 ? "Plan A" : "Plan B"}</th><td colSpan={simulation.years.length} className="border-b border-line p-2 text-secondary">Results unavailable</td></tr>;
                  return <tr key={scenario.id}><th className="border-b border-line p-2 text-left font-semibold text-primary">{scenario.name}</th>{result.annual.map((entry) => <td key={entry.year} className={`border-b border-line p-2 text-center font-mono ${entry.year === selectedYear ? "bg-control font-bold text-accent" : entry.transitionCount ? "text-primary" : "text-secondary"}`}>{entry.transitionCount || "—"}</td>)}</tr>;
                })}
              </tbody>
            </table>
          </div>}
      </article>
    </div>
  </section>;
}
