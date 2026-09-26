import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { CollapsibleSection } from "./CollapsibleSection";
import { createProjectDocument } from "../domain/projectDocument";
import { simulate } from "../Simulation/engine";
import { useFleetStore } from "../state/fleetStore";
import { usePresetStore } from "../state/presetStore";
import { useProjectStore } from "../state/projectStore";

export function CostAnalysis() {
  const vehicles = useFleetStore((state) => state.vehicles);
  const presets = usePresetStore((state) => state.presets);
  const analysis = useFleetStore((state) => state.analysis);
  const scenarios = useProjectStore((state) => state.scenarios);
  const activeScenarioId = useProjectStore((state) => state.activeScenarioId);
  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId) ?? scenarios[0];
  const result = useMemo(() => {
    if (!activeScenario) return null;
    return simulate({ project: createProjectDocument(presets, vehicles, analysis), scenario: activeScenario.document });
  }, [activeScenario, analysis, presets, vehicles]);

  if (!result) return null;
  const { scenario, savings, payback, annual } = result;
  const years = annual.map((point) => point.year);
  const annualSavings = annual.map((point, index) => point.cumulativeCashSavings - (annual[index - 1]?.cumulativeCashSavings ?? 0));
  const currency = new Intl.NumberFormat("en-SG", { style: "currency", currency: analysis.currency, maximumFractionDigits: 0 });
  const chartCurrency = new Intl.NumberFormat("en-SG", { style: "currency", currency: analysis.currency, maximumFractionDigits: 2 });
  const paybackYear = payback.year;
  const hasAnnualCashFlow = annualSavings.some((value) => value !== 0);
  const chartOption: EChartsOption = {
    animationDuration: 500,
    aria: { enabled: true, decal: { show: true } },
    color: ["#a7b8b2", "#55d6be"],
    grid: { left: 52, right: 18, top: 42, bottom: 72, containLabel: true },
    legend: { bottom: 4, left: "center", itemWidth: 14, itemHeight: 8, textStyle: { color: "#b1c3bd", fontSize: 11 }, data: ["Current fleet baseline", "Active transition plan"] },
    tooltip: { trigger: "axis", valueFormatter: (value) => chartCurrency.format(Number(value)), backgroundColor: "#10201d", borderColor: "#405a53", textStyle: { color: "#eef7f3" } },
    xAxis: { type: "category", boundaryGap: false, data: years, axisLine: { lineStyle: { color: "#405a53" } }, axisLabel: { color: "#b1c3bd", fontSize: 10 } },
    yAxis: { type: "value", name: analysis.currency, nameLocation: "middle", nameGap: 70, nameTextStyle: { color: "#b1c3bd" }, axisLabel: { color: "#b1c3bd", formatter: (value: number) => currency.format(value) }, splitLine: { lineStyle: { color: "#273a35" } } },
    series: [
      { name: "Current fleet baseline", type: "line", smooth: true, symbol: "circle", symbolSize: 7, data: annual.map((point) => point.baseline.cumulativeCashCost), lineStyle: { width: 3 } },
      { name: "Active transition plan", type: "line", smooth: true, symbol: "circle", symbolSize: 7, data: annual.map((point) => point.scenario.cumulativeCashCost), lineStyle: { width: 3 }, areaStyle: { color: "rgba(85, 214, 190, 0.08)" }, markLine: paybackYear ? { symbol: "none", lineStyle: { color: "#55d6be", type: "dashed" }, label: { formatter: `Payback ${paybackYear}`, color: "#06231d", backgroundColor: "#55d6be" }, data: [{ xAxis: paybackYear }] } : undefined },
    ],
  };
  const annualCashFlowOption: EChartsOption = {
    animationDuration: 500,
    aria: { enabled: true },
    grid: { left: 62, right: 18, top: 18, bottom: 34, containLabel: true },
    tooltip: { trigger: "axis", valueFormatter: (value) => chartCurrency.format(Number(value)), axisPointer: { type: "shadow" }, backgroundColor: "#10201d", borderColor: "#405a53", textStyle: { color: "#eef7f3" } },
    xAxis: { type: "category", data: years, axisLabel: { color: "#b1c3bd", fontSize: 10 } },
    yAxis: { type: "value", name: analysis.currency, axisLabel: { color: "#b1c3bd", formatter: (value: number) => currency.format(value) }, splitLine: { lineStyle: { color: "#273a35" } } },
    series: [{ name: "Annual net saving", type: "bar", barMaxWidth: 24, data: annualSavings.map((value) => ({ value, itemStyle: { color: value >= 0 ? "#55d6be" : "#d58b79" } })) }],
  };
  return <CollapsibleSection title="Cost over time" description="Calculated baseline and active transition plan. Lower cumulative cost is better." defaultOpen>
    <div className="grid grid-cols-2 gap-3">
      <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">Payback period</p><p className="mt-2 text-2xl font-semibold">{paybackYear ?? "Not reached"}</p><p className="mt-1 text-xs text-secondary">{paybackYear ? (payback.status === "initial-parity" ? "Initial parity" : "End-of-year cash breakeven") : "Within analysis period"}</p></article>
      <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">Estimated savings</p><p className="mt-2 text-2xl font-semibold">{currency.format(savings)}</p><p className="mt-1 text-xs text-secondary">Baseline TCO minus active plan</p></article>
      <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">Transition cost</p><p className="mt-2 text-2xl font-semibold">{currency.format(scenario.acquisitionCapex)}</p><p className="mt-1 text-xs text-secondary">Total transition CAPEX</p></article>
      <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">TCO</p><p className="mt-2 text-2xl font-semibold">{currency.format(scenario.tco)}</p><p className="mt-1 text-xs text-secondary">Active plan over {annual.length} years</p></article>
      <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">OPEX</p><p className="mt-2 text-2xl font-semibold">{currency.format(scenario.operatingCost)}</p><p className="mt-1 text-xs text-secondary">Total operating expenditure</p></article>
      <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">Plan status</p><p className={`mt-2 text-2xl font-semibold ${savings >= 0 ? "text-accent" : "text-[#d58b79]"}`}>{savings >= 0 ? "Lower TCO" : "Higher TCO"}</p><p className="mt-1 text-xs text-secondary">Compared with baseline</p></article>
    </div>
    <div className="mt-4 rounded-lg border border-line bg-panel p-2"><h3 className="px-2 pt-1 text-base font-semibold">Cumulative fleet cost</h3><p className="px-2 pt-1 text-xs text-secondary">Live output for {activeScenario.name}. Includes operating costs and transition CAPEX.</p><div className="mt-2 h-[460px] w-full" role="img" aria-label="Interactive cumulative cost comparison chart from the analysis period"><ReactECharts option={chartOption} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate opts={{ renderer: "svg" }} /></div></div>
    <div className="mt-4 rounded-lg border border-line bg-panel p-2"><h3 className="px-2 pt-1 text-base font-semibold">Annual net cash flow</h3><p className="px-2 pt-1 text-xs text-secondary">Positive bars indicate annual savings against the no-transition baseline.</p><div className="relative mt-2 h-[280px] w-full" role="img" aria-label="Annual net cash flow chart for the analysis period"><ReactECharts option={annualCashFlowOption} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate opts={{ renderer: "svg" }} />{!hasAnnualCashFlow && <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-secondary">No annual cash flow variance: the active plan matches the baseline.</p>}</div></div>
    <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-panel"><table className="w-full min-w-[620px] text-left text-xs"><caption className="px-3 py-3 text-left text-base font-semibold">Annual financial results</caption><thead className="border-y border-line bg-control text-secondary"><tr><th className="px-3 py-2 font-semibold">Year</th><th className="px-3 py-2 font-semibold">Baseline cost</th><th className="px-3 py-2 font-semibold">Plan cost</th><th className="px-3 py-2 font-semibold">Annual savings</th><th className="px-3 py-2 font-semibold">Cumulative savings</th></tr></thead><tbody>{annual.map((point, index) => <tr key={point.year} className="border-b border-line last:border-b-0"><th scope="row" className="px-3 py-2 font-semibold">{point.year}</th><td className="px-3 py-2">{currency.format(point.baseline.netCashCost)}</td><td className="px-3 py-2">{currency.format(point.scenario.netCashCost)}</td><td className={annualSavings[index] >= 0 ? "px-3 py-2 text-accent" : "px-3 py-2 text-[#d58b79]"}>{currency.format(annualSavings[index])}</td><td className={point.cumulativeCashSavings >= 0 ? "px-3 py-2 text-accent" : "px-3 py-2 text-[#d58b79]"}>{currency.format(point.cumulativeCashSavings)}</td></tr>)}</tbody></table></div>
    <p className="mt-2 border-t border-line pt-4 text-xs leading-relaxed text-secondary"><strong className="text-accent">How to read this:</strong> Payback is the first modeled year where cumulative cash savings become and remain nonnegative. Values update when fleet assignments, transition years or economic assumptions change.</p>
  </CollapsibleSection>;
}
