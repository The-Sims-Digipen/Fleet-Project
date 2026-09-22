import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { CollapsibleSection } from "./CollapsibleSection";
import { calculateScenarioComparison, type ScenarioComparisonResult } from "../project/comparisonModel";
import { useFleetStore } from "../state/fleetStore";
import { usePresetStore } from "../state/presetStore";
import { useProjectStore } from "../state/projectStore";
import { useTimelineStore } from "../state/timelineStore";

const currency = new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 });
const baselineScenario = (id: string, worldId: string, vehicleIds: string[]) => ({
  id,
  worldId,
  name: "Current fleet baseline",
  revision: 0,
  worldRevision: 0,
  document: { version: 1 as const, vehiclePlans: Object.fromEntries(vehicleIds.map((vehicleId) => [vehicleId, { transitionYear: null }])) },
});

function calculatePaybackYear(baseline: ScenarioComparisonResult, scenario: ScenarioComparisonResult): number | null {
  const savings = baseline.yearly.map((point, index) => point.cumulativeCost - (scenario.yearly[index]?.cumulativeCost ?? 0));
  const index = savings.findIndex((value, current) => value >= 0 && savings.slice(current).every((later) => later >= 0));
  return index < 0 ? null : baseline.yearly[index].year;
}

export function CostAnalysis() {
  const vehicles = useFleetStore((state) => state.vehicles);
  const presets = usePresetStore((state) => state.presets);
  const selectedYear = useTimelineStore((state) => state.selectedYear);
  const scenarios = useProjectStore((state) => state.scenarios);
  const activeScenarioId = useProjectStore((state) => state.activeScenarioId);
  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId) ?? scenarios[0];
  const result = useMemo(() => {
    if (!activeScenario) return null;
    const baseline = calculateScenarioComparison(baselineScenario(`${activeScenario.id}-baseline`, activeScenario.worldId, vehicles.map((vehicle) => vehicle.vehicleId)), vehicles, presets, selectedYear);
    const scenario = calculateScenarioComparison(activeScenario, vehicles, presets, selectedYear);
    return { baseline, scenario, breakEven: calculatePaybackYear(baseline, scenario), savings: baseline.tco - scenario.tco };
  }, [activeScenario, vehicles, presets, selectedYear]);

  if (!result) return null;
  const { baseline, scenario, breakEven, savings } = result;
  const years = scenario.yearly.map((point) => point.year);
  const annualSavings = baseline.yearly.map((point, index) => point.annualCost - (scenario.yearly[index]?.annualCost ?? 0));
  const chartOption: EChartsOption = {
    animationDuration: 500,
    aria: { enabled: true, decal: { show: true } },
    color: ["#a7b8b2", "#55d6be"],
    grid: { left: 52, right: 18, top: 42, bottom: 72, containLabel: true },
    legend: { bottom: 4, left: "center", itemWidth: 14, itemHeight: 8, textStyle: { color: "#b1c3bd", fontSize: 11 }, data: ["Current fleet baseline", "Active transition plan"] },
    tooltip: { trigger: "axis", backgroundColor: "#10201d", borderColor: "#405a53", textStyle: { color: "#eef7f3" } },
    xAxis: { type: "category", boundaryGap: false, data: years, axisLine: { lineStyle: { color: "#405a53" } }, axisLabel: { color: "#b1c3bd", fontSize: 10 } },
    yAxis: { type: "value", name: "SGD", nameLocation: "middle", nameGap: 42, nameTextStyle: { color: "#b1c3bd" }, axisLabel: { color: "#b1c3bd", formatter: "${value}" }, splitLine: { lineStyle: { color: "#273a35" } } },
    series: [
      { name: "Current fleet baseline", type: "line", smooth: true, symbol: "circle", symbolSize: 7, data: baseline.yearly.map((point) => point.cumulativeCost), lineStyle: { width: 3 } },
      { name: "Active transition plan", type: "line", smooth: true, symbol: "circle", symbolSize: 7, data: scenario.yearly.map((point) => point.cumulativeCost), lineStyle: { width: 3 }, areaStyle: { color: "rgba(85, 214, 190, 0.08)" }, markLine: breakEven ? { symbol: "none", lineStyle: { color: "#55d6be", type: "dashed" }, label: { formatter: `Payback ${breakEven}`, color: "#06231d", backgroundColor: "#55d6be" }, data: [{ xAxis: breakEven }] } : undefined },
    ],
  };
  const annualCashFlowOption: EChartsOption = {
    animationDuration: 500,
    aria: { enabled: true },
    grid: { left: 62, right: 18, top: 18, bottom: 34, containLabel: true },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, backgroundColor: "#10201d", borderColor: "#405a53", textStyle: { color: "#eef7f3" } },
    xAxis: { type: "category", data: years, axisLabel: { color: "#b1c3bd", fontSize: 10 } },
    yAxis: { type: "value", name: "SGD", axisLabel: { color: "#b1c3bd", formatter: "${value}" }, splitLine: { lineStyle: { color: "#273a35" } } },
    series: [{ name: "Annual net saving", type: "bar", barMaxWidth: 24, data: annualSavings.map((value) => ({ value, itemStyle: { color: value >= 0 ? "#55d6be" : "#d58b79" } })) }],
  };
  return <CollapsibleSection title="Cost over time" description="Calculated baseline and active transition plan. Lower cumulative cost is better." defaultOpen>
    <div className="grid grid-cols-2 gap-3">
      <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">Payback year</p><p className="mt-2 text-2xl font-semibold">{breakEven ?? "Not reached"}</p><p className="mt-1 text-xs text-secondary">End-of-year cash breakeven</p></article>
      <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">TCO saving</p><p className="mt-2 text-2xl font-semibold">{currency.format(savings)}</p><p className="mt-1 text-xs text-secondary">Baseline minus active plan</p></article>
      <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">Final-year TCO</p><p className="mt-2 text-2xl font-semibold">{currency.format(scenario.tco)}</p><p className="mt-1 text-xs text-secondary">Active transition plan</p></article>
      <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">Plan status</p><p className={`mt-2 text-2xl font-semibold ${savings >= 0 ? "text-accent" : "text-[#d58b79]"}`}>{savings >= 0 ? "Lower TCO" : "Higher TCO"}</p><p className="mt-1 text-xs text-secondary">Compared with baseline</p></article>
    </div>
    <div className="mt-4 rounded-lg border border-line bg-panel p-2"><h3 className="px-2 pt-1 text-base font-semibold">Cumulative fleet cost</h3><p className="px-2 pt-1 text-xs text-secondary">Live output for {activeScenario.name}. Includes operating costs and transition CAPEX.</p><div className="mt-2 h-[460px] w-full" role="img" aria-label="Interactive cumulative cost comparison chart from the analysis period"><ReactECharts option={chartOption} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate opts={{ renderer: "svg" }} /></div></div>
    <div className="mt-4 rounded-lg border border-line bg-panel p-2"><h3 className="px-2 pt-1 text-base font-semibold">Annual net cash flow</h3><p className="px-2 pt-1 text-xs text-secondary">Positive bars indicate annual savings against the no-transition baseline.</p><div className="mt-2 h-[280px] w-full" role="img" aria-label="Annual net cash flow chart for the analysis period"><ReactECharts option={annualCashFlowOption} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate opts={{ renderer: "svg" }} /></div></div>
    <p className="mt-2 border-t border-line pt-4 text-xs leading-relaxed text-secondary"><strong className="text-accent">How to read this:</strong> Payback is the first modeled year where cumulative cash savings become and remain nonnegative. Values update when fleet assignments or transition years change.</p>
  </CollapsibleSection>;
}
