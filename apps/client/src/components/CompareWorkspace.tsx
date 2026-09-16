import ReactECharts from "echarts-for-react";
import { useEffect, useMemo, useState } from "react";
import { calculateScenarioComparison, comparisonPreviewAssumptions, type ScenarioComparisonResult } from "../project/comparisonModel";
import type { Scenario } from "../project/types";
import type { SceneDocument } from "../scene/types";
import { useFleetStore, type MockVehicle } from "../state/fleetStore";
import { usePresetStore } from "../state/presetStore";
import type { VehiclePreset } from "../vehicles/types";
import { useProjectStore } from "../state/projectStore";
import { END_YEAR, START_YEAR, useTimelineStore } from "../state/timelineStore";
import { ComparisonViewport } from "./ComparisonViewport";

const currency = new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-SG", { maximumFractionDigits: 1 });
const price = (value: number) => `$${value.toFixed(2)}`;

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="rounded-lg border border-line bg-control px-3 py-3">
    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-secondary">{label}</p>
    <p className="mt-1 text-lg font-semibold text-primary">{value}</p>
    {detail && <p className="mt-1 text-[11px] leading-relaxed text-secondary">{detail}</p>}
  </div>;
}

function ScenarioColumn({ slot, scenario, result, worldDocument, vehicles, presets, selectedYear, onEdit }: {
  slot: "A" | "B";
  scenario: Scenario;
  result: ScenarioComparisonResult;
  worldDocument: SceneDocument;
  vehicles: MockVehicle[];
  presets: VehiclePreset[];
  selectedYear: number;
  onEdit: () => void;
}) {
  const [cameraReset, setCameraReset] = useState(0);
  const overloaded = result.peakDemandKw > result.siteLimitKw;
  return <article className="min-w-[520px] flex-1 overflow-hidden rounded-xl border border-line-strong bg-panel">
    <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
      <div className="min-w-0"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-accent">{`Plan ${slot}`}</p><h3 className="truncate text-lg font-semibold" title={scenario.name}>{scenario.name}</h3></div>
      <div className="flex gap-2"><button type="button" className="min-h-9 rounded border border-line-strong px-3 text-xs font-bold text-secondary hover:border-accent hover:text-primary" onClick={() => setCameraReset((value) => value + 1)}>Reset view</button><button type="button" className="min-h-9 rounded bg-accent px-3 text-xs font-bold text-accent-ink hover:bg-accent/85" onClick={onEdit}>{`Edit ${slot}`}</button></div>
    </div>
    <div className="relative h-[330px] border-b border-line">
      <ComparisonViewport world={worldDocument} scenario={scenario} vehicles={vehicles} presets={presets} year={selectedYear} reset={cameraReset} />
      <div className="pointer-events-none absolute left-3 top-3 rounded border border-line-strong bg-panel/85 px-2 py-1 font-mono text-[10px] text-secondary backdrop-blur">{selectedYear} · shared world</div>
    </div>
    <div className="grid grid-cols-3 gap-2 p-4">
      <Metric label="Electric" value={String(result.electricCount)} detail={`${result.combustionCount} combustion · ${result.hybridCount} hybrid`} />
      <Metric label="Chargers" value={String(result.chargerCount)} detail="Preview: one connector per charging vehicle" />
      <Metric label="Peak power" value={`${number.format(result.peakDemandKw)} kW`} detail={`${number.format(result.siteLimitKw)} kW preview limit`} />
      <Metric label="10-year TCO" value={currency.format(result.tco)} detail="Energy + transition purchases" />
      <Metric label="Transition CAPEX" value={currency.format(result.capex)} detail={`${START_YEAR}–${END_YEAR}`} />
      <Metric label={`${selectedYear} OPEX`} value={currency.format(result.annualOpex)} detail="Preview annual energy cost" />
      <Metric label="10-year emissions" value={`${number.format(result.emissionsTonnes)} tCO₂e`} detail="Synthetic preview factors" />
      <Metric label={`${selectedYear} emissions`} value={`${number.format(result.selectedYearEmissionsTonnes)} tCO₂e`} detail="Operational only" />
      <div className={`rounded-lg border px-3 py-3 ${overloaded ? "border-[#b3563f] bg-[#2a1512]" : "border-[#355149] bg-[#0f211d]"}`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-secondary">Feasibility</p>
        <p className={`mt-1 text-sm font-semibold ${overloaded ? "text-[#f0a58f]" : "text-accent"}`}>{overloaded ? "Power limit exceeded" : "Within preview limit"}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-secondary">{result.warnings[0]}</p>
      </div>
    </div>
  </article>;
}

function Delta({ label, a, b, format, lowerIsBetter = false }: { label: string; a: number; b: number; format: (value: number) => string; lowerIsBetter?: boolean }) {
  const delta = b - a;
  const direction = delta === 0 ? "No difference" : `Plan B ${delta > 0 ? "+" : "−"}${format(Math.abs(delta))}`;
  const meaning = delta === 0 ? "same value" : lowerIsBetter ? (delta < 0 ? "lower" : "higher") : (delta > 0 ? "more" : "less");
  return <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line py-3 last:border-b-0">
    <div><p className="text-sm font-semibold text-primary">{label}</p><p className="mt-0.5 text-[11px] text-secondary">B minus A · Plan B is {meaning}</p></div>
    <span className="font-mono text-sm font-semibold tabular-nums text-primary">{direction}</span>
  </div>;
}

export function CompareWorkspace({ onEditScenario }: { onEditScenario: (scenarioId: string) => void }) {
  const scenarios = useProjectStore((state) => state.scenarios);
  const activeScenarioId = useProjectStore((state) => state.activeScenarioId);
  const worldName = useProjectStore((state) => state.worldName);
  const worlds = useProjectStore((state) => state.worlds);
  const worldId = useProjectStore((state) => state.worldId);
  const vehicles = useFleetStore((state) => state.vehicles);
  const presets = usePresetStore((state) => state.presets);
  const selectedYear = useTimelineStore((state) => state.selectedYear);
  const setSelectedYear = useTimelineStore((state) => state.setSelectedYear);
  const [scenarioAId, setScenarioAId] = useState(activeScenarioId);
  const [scenarioBId, setScenarioBId] = useState(() => scenarios.find((scenario) => scenario.id !== activeScenarioId)?.id ?? "");

  useEffect(() => {
    if (!scenarios.some((scenario) => scenario.id === scenarioAId)) setScenarioAId(scenarios[0]?.id ?? "");
    if (!scenarios.some((scenario) => scenario.id === scenarioBId) || scenarioBId === scenarioAId) {
      setScenarioBId(scenarios.find((scenario) => scenario.id !== scenarioAId)?.id ?? "");
    }
  }, [scenarioAId, scenarioBId, scenarios]);

  const scenarioA = scenarios.find((scenario) => scenario.id === scenarioAId) ?? scenarios[0];
  const scenarioB = scenarios.find((scenario) => scenario.id === scenarioBId);
  const world = worlds.find((item) => item.id === worldId);
  const resultA = useMemo(() => scenarioA ? calculateScenarioComparison(scenarioA, vehicles, presets, selectedYear) : null, [scenarioA, vehicles, presets, selectedYear]);
  const resultB = useMemo(() => scenarioB ? calculateScenarioComparison(scenarioB, vehicles, presets, selectedYear) : null, [scenarioB, vehicles, presets, selectedYear]);

  if (!world || !scenarioA) return <div className="grid flex-1 place-items-center text-secondary">No active world is available.</div>;

  const duplicateForComparison = () => {
    const sourceId = scenarioA.id;
    useProjectStore.getState().duplicateScenario(sourceId);
    const nextId = useProjectStore.getState().activeScenarioId;
    setScenarioAId(sourceId);
    setScenarioBId(nextId);
  };

  if (!scenarioB || !resultA || !resultB) {
    return <section id="compare-workspace" tabIndex={-1} className="grid min-h-0 flex-1 place-items-center overflow-auto p-8">
      <div className="max-w-xl rounded-xl border border-line-strong bg-panel p-7 text-center">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Compare</p>
        <h2 className="mt-2 text-2xl font-semibold">A second scenario is required</h2>
        <p className="mt-3 text-sm leading-relaxed text-secondary">Comparison keeps the world fixed and shows two scenario plans side by side. Duplicate {scenarioA.name} to create a starting point, then edit the copy.</p>
        <button type="button" className="mt-5 min-h-11 rounded-lg bg-accent px-4 text-sm font-bold text-accent-ink hover:bg-accent/85" onClick={duplicateForComparison}>Duplicate current plan</button>
      </div>
    </section>;
  }

  const chartOption = {
    animation: false,
    tooltip: { trigger: "axis" },
    legend: { data: [scenarioA.name, scenarioB.name], textStyle: { color: "#b1c3bd" } },
    grid: { left: 54, right: 20, top: 42, bottom: 38 },
    xAxis: { type: "category", data: resultA.yearly.map((point) => point.year), axisLine: { lineStyle: { color: "#405a53" } }, axisLabel: { color: "#b1c3bd" } },
    yAxis: { type: "value", axisLabel: { color: "#b1c3bd", formatter: (value: number | string) => `$${Math.round(Number(value) / 1000)}k` }, splitLine: { lineStyle: { color: "#273a35" } } },
    series: [
      { name: scenarioA.name, type: "line", smooth: true, symbolSize: 6, data: resultA.yearly.map((point) => Math.round(point.cumulativeCost)), lineStyle: { width: 3 } },
      { name: scenarioB.name, type: "line", smooth: true, symbolSize: 6, data: resultB.yearly.map((point) => Math.round(point.cumulativeCost)), lineStyle: { width: 3 } },
    ],
  };

  return <section id="compare-workspace" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto bg-surface px-[clamp(16px,2.5vw,34px)] py-5">
    <div className="mx-auto grid w-full max-w-[1680px] gap-5">
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-line-strong bg-panel p-4">
        <div className="mr-auto min-w-[220px]"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Comparison workspace</p><h2 className="mt-1 text-xl font-semibold">{worldName}</h2><p className="mt-1 text-xs text-secondary">Both scenarios use this shared world and the same selected year.</p></div>
        <label className="grid min-w-[210px] gap-1 text-[11px] font-semibold text-secondary">Plan A<select className="min-h-10 rounded border border-line-strong bg-control px-3 text-sm text-primary" value={scenarioA.id} onChange={(event) => setScenarioAId(event.target.value)}>{scenarios.map((scenario) => <option key={scenario.id} value={scenario.id} disabled={scenario.id === scenarioB.id}>{scenario.name}</option>)}</select></label>
        <span className="pb-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-secondary">vs</span>
        <label className="grid min-w-[210px] gap-1 text-[11px] font-semibold text-secondary">Plan B<select className="min-h-10 rounded border border-line-strong bg-control px-3 text-sm text-primary" value={scenarioB.id} onChange={(event) => setScenarioBId(event.target.value)}>{scenarios.map((scenario) => <option key={scenario.id} value={scenario.id} disabled={scenario.id === scenarioA.id}>{scenario.name}</option>)}</select></label>
        <label className="grid min-w-[150px] gap-1 text-[11px] font-semibold text-secondary">Shared year<select className="min-h-10 rounded border border-line-strong bg-control px-3 text-sm text-primary" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>{Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, index) => START_YEAR + index).map((year) => <option key={year}>{year}</option>)}</select></label>
      </div>

      <div className="overflow-x-auto pb-1"><div className="flex min-w-max gap-4 xl:min-w-0"><ScenarioColumn slot="A" scenario={scenarioA} result={resultA} worldDocument={world.document} vehicles={vehicles} presets={presets} selectedYear={selectedYear} onEdit={() => onEditScenario(scenarioA.id)} /><ScenarioColumn slot="B" scenario={scenarioB} result={resultB} worldDocument={world.document} vehicles={vehicles} presets={presets} selectedYear={selectedYear} onEdit={() => onEditScenario(scenarioB.id)} /></div></div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-xl border border-line-strong bg-panel p-5"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Difference</p><h3 className="mt-1 text-lg font-semibold">Plan B minus Plan A</h3><p className="mt-1 text-xs text-secondary">Direction is always B − A so the sign is unambiguous.</p><div className="mt-4"><Delta label="10-year TCO" a={resultA.tco} b={resultB.tco} format={(value) => currency.format(value)} lowerIsBetter /><Delta label="Transition CAPEX" a={resultA.capex} b={resultB.capex} format={(value) => currency.format(value)} lowerIsBetter /><Delta label={`${selectedYear} OPEX`} a={resultA.annualOpex} b={resultB.annualOpex} format={(value) => currency.format(value)} lowerIsBetter /><Delta label="10-year emissions" a={resultA.emissionsTonnes} b={resultB.emissionsTonnes} format={(value) => `${number.format(value)} tCO₂e`} lowerIsBetter /><Delta label="Peak demand" a={resultA.peakDemandKw} b={resultB.peakDemandKw} format={(value) => `${number.format(value)} kW`} lowerIsBetter /><Delta label="Charging vehicles" a={resultA.chargerCount} b={resultB.chargerCount} format={(value) => number.format(value)} /></div></article>
        <article className="rounded-xl border border-line-strong bg-panel p-5"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Cost over time</p><h3 className="mt-1 text-lg font-semibold">Cumulative preview cost</h3><p className="mt-1 text-xs text-secondary">Same shared preview assumptions for both plans.</p><div className="mt-3 h-[360px]"><ReactECharts option={chartOption} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate opts={{ renderer: "svg" }} /></div></article>
      </div>

      <article className="rounded-xl border border-line-strong bg-panel p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Transition roadmap</p><h3 className="mt-1 text-lg font-semibold">Vehicles changing by year</h3></div><p className="max-w-2xl text-right text-[11px] leading-relaxed text-secondary">Frontend preview assumptions: {price(comparisonPreviewAssumptions.dieselPricePerLitre)}/L diesel, {price(comparisonPreviewAssumptions.electricityPricePerKwh)}/kWh electricity, {comparisonPreviewAssumptions.siteLimitKw} kW site limit, synthetic operational-emissions factors. Replace these with the simulation engine when F04/F06 are connected.</p></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-xs"><thead><tr><th className="border-b border-line p-2 text-left text-secondary">Scenario</th>{Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, index) => START_YEAR + index).map((year) => <th key={year} className={`border-b border-line p-2 text-center ${year === selectedYear ? "text-accent" : "text-secondary"}`}>{year}</th>)}</tr></thead><tbody>{[[scenarioA, resultA], [scenarioB, resultB]].map(([scenario, result]) => <tr key={(scenario as Scenario).id}><th className="border-b border-line p-2 text-left font-semibold text-primary">{(scenario as Scenario).name}</th>{Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, index) => START_YEAR + index).map((year) => <td key={year} className={`border-b border-line p-2 text-center font-mono ${(result as ScenarioComparisonResult).transitionsByYear[year] ? "text-primary" : "text-secondary"}`}>{(result as ScenarioComparisonResult).transitionsByYear[year] || "—"}</td>)}</tr>)}</tbody></table></div></article>
    </div>
  </section>;
}
