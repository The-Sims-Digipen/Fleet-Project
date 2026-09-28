import { useMemo } from "react";
import ReactECharts from "echarts-for-react";

import { simulateProject } from "../domain/simulation";
import { useProjectStore } from "../state/projectStore";
import { CollapsibleSection } from "./CollapsibleSection";

const number = new Intl.NumberFormat("en-SG", { maximumFractionDigits: 1 });

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="rounded-lg border border-line bg-panel p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">{label}</p>
    <p className="mt-2 text-xl font-semibold text-primary">{value}</p>
    <p className="mt-1 text-xs text-secondary">{detail}</p>
  </article>;
}

export function CostAnalysis() {
  const document = useProjectStore((state) => state.runtime.document);
  const selectedYear = useProjectStore((state) => state.runtime.editor.selectedYear);
  const simulation = useMemo(() => simulateProject(document), [document]);
  const scenario = simulation.scenarios[document.activeScenarioId];
  const formatCurrency = (value: number) => `${document.analysis.currency} ${value.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const annual = scenario?.annual.find((row) => row.year === selectedYear);
  const tcoLabel = document.analysis.discountRate > 0 ? "Present value TCO" : "TCO";

  const cumulativeOption = useMemo(() => ({
    animation: false,
    tooltip: { trigger: "axis", valueFormatter: (value: number) => formatCurrency(value) },
    legend: { textStyle: { color: "#b1c3bd" }, bottom: 0 },
    grid: { left: 68, right: 22, top: 16, bottom: 58, containLabel: true },
    xAxis: { type: "category", data: simulation.years, axisLine: { lineStyle: { color: "#405a53" } }, axisLabel: { color: "#b1c3bd" } },
    yAxis: { type: "value", axisLabel: { color: "#b1c3bd", formatter: (value: number) => formatCurrency(value) }, splitLine: { lineStyle: { color: "#273a35" } } },
    series: [
      { name: "Current fleet baseline", type: "line", smooth: false, symbol: "circle", data: simulation.baseline.annual.map((row) => row.cumulativeCashCost), lineStyle: { width: 3, color: "#4f7cff" }, itemStyle: { color: "#4f7cff" } },
      { name: scenario?.scenarioName ?? "Active Scenario", type: "line", smooth: false, symbol: "circle", data: scenario?.annual.map((row) => row.cumulativeCashCost) ?? [], lineStyle: { width: 3, color: "#55d6be" }, itemStyle: { color: "#55d6be" }, markLine: { silent: true, symbol: ["none", "none"], label: { show: false }, lineStyle: { color: "#b1c3bd", type: "dashed" }, data: [{ xAxis: selectedYear }] } },
    ],
  }), [simulation, scenario, selectedYear, document.analysis.currency]);

  const annualOption = useMemo(() => ({
    animation: false,
    tooltip: { trigger: "axis", valueFormatter: (value: number) => formatCurrency(value) },
    legend: { textStyle: { color: "#b1c3bd" }, bottom: 0 },
    grid: { left: 68, right: 22, top: 16, bottom: 58, containLabel: true },
    xAxis: { type: "category", data: simulation.years, axisLine: { lineStyle: { color: "#405a53" } }, axisLabel: { color: "#b1c3bd" } },
    yAxis: { type: "value", axisLabel: { color: "#b1c3bd", formatter: (value: number) => formatCurrency(value) }, splitLine: { lineStyle: { color: "#273a35" } } },
    series: [
      { name: "Current fleet baseline", type: "bar", data: simulation.baseline.annual.map((row) => row.netCashCost), itemStyle: { color: "#4f7cff" } },
      { name: scenario?.scenarioName ?? "Active Scenario", type: "bar", data: scenario?.annual.map((row) => row.netCashCost) ?? [], itemStyle: { color: "#55d6be" } },
    ],
  }), [simulation, scenario, document.analysis.currency]);

  return <CollapsibleSection title="Cost & emissions" description="Derived from Project Vehicles, Presets, Scenario transitions, and shared Analysis Settings." defaultOpen>
    {!scenario ? <p role="status" className="text-xs text-secondary">No Scenario results are available for this Project.</p> : <>
      <div className="grid grid-cols-2 gap-3">
        <Metric label={tcoLabel} value={formatCurrency(scenario.totals.tco)} detail={`${scenario.scenarioName} · discounted Project costs`} />
        <Metric label="Savings vs baseline" value={formatCurrency(scenario.totals.savings ?? 0)} detail="Positive values mean the plan costs less." />
        <Metric label="Payback year" value={scenario.paybackYear === null ? "Not reached" : String(scenario.paybackYear)} detail={scenario.paybackStatus === "initial-parity" ? "No upfront premium; cash savings stay nonnegative." : scenario.paybackStatus === "reached" ? "Cumulative cash savings remain nonnegative." : "Cash savings do not remain nonnegative through the analysis period."} />
        <Metric label="Transition CAPEX" value={formatCurrency(scenario.totals.transitionCapex)} detail="Owned vehicle acquisitions for planned transitions." />
        <Metric label="Fuel used" value={`${number.format(scenario.totals.totalFuelLitres)} L`} detail={`Baseline: ${number.format(simulation.baseline.totals.totalFuelLitres)} L`} />
        <Metric label="Electricity used" value={`${number.format(scenario.totals.totalElectricityKWh)} kWh`} detail={`Baseline: ${number.format(simulation.baseline.totals.totalElectricityKWh)} kWh`} />
        <Metric label="Emissions" value={`${number.format(scenario.totals.emissionsKgCo2e)} kg CO₂e`} detail={`${number.format(scenario.totals.emissionsReductionKgCo2e ?? 0)} kg reduction vs baseline`} />
        <Metric label={`${selectedYear} net cash cost`} value={formatCurrency(annual?.netCashCost ?? 0)} detail={`${annual?.transitionCount ?? 0} transition${annual?.transitionCount === 1 ? "" : "s"} in this year.`} />
      </div>

      <div className="mt-4 rounded-lg border border-line bg-panel p-2">
        <h3 className="px-2 pt-1 text-base font-semibold">Cumulative Project cost</h3>
        <p className="px-2 pt-1 text-xs text-secondary">Nominal cash cost by year, including acquisition and disposal cash flows.</p>
        <div className="mt-2 h-[320px] w-full" role="img" aria-label={`Cumulative cost comparison for ${scenario.scenarioName}`}>
          <ReactECharts option={cumulativeOption} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate opts={{ renderer: "svg" }} />
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-line bg-panel p-2">
        <h3 className="px-2 pt-1 text-base font-semibold">Annual net cash cost</h3>
        <p className="px-2 pt-1 text-xs text-secondary">Each Scenario uses the same Project-level assumptions.</p>
        <div className="mt-2 h-[280px] w-full" role="img" aria-label={`Annual cash cost comparison for ${scenario.scenarioName}`}>
          <ReactECharts option={annualOption} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate opts={{ renderer: "svg" }} />
        </div>
      </div>
    </>}
  </CollapsibleSection>;
}
