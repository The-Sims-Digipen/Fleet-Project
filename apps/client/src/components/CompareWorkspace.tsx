import ReactECharts from "echarts-for-react";
import { useState } from "react";
import { ComparisonViewport, type DemoPlanKey } from "./ComparisonViewport";

const currency = new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-SG", { maximumFractionDigits: 0 });

type DemoPlan = {
  key: DemoPlanKey;
  slot: "A" | "B";
  name: string;
  summary: string;
  electric: number;
  diesel: number;
  chargers: number;
  tco: number;
  capex: number;
  opex: number;
  emissions: number;
  peakPower: number;
  feasibility: string;
  feasibilityDetail: string;
  roadmap: number[];
  cumulativeCost: number[];
};

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

const PLANS: [DemoPlan, DemoPlan] = [
  {
    key: "gradual",
    slot: "A",
    name: "Gradual Transition",
    summary: "Lower upfront spend with vehicles replaced progressively as they reach replacement age.",
    electric: 4,
    diesel: 6,
    chargers: 4,
    tco: 4_180_000,
    capex: 1_050_000,
    opex: 465_000,
    emissions: 362,
    peakPower: 480,
    feasibility: "Within site capacity",
    feasibilityDetail: "Plenty of spare electrical headroom for overnight charging.",
    roadmap: [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    cumulativeCost: [420, 830, 1240, 1660, 2070, 2490, 2910, 3330, 3760, 4180],
  },
  {
    key: "accelerated",
    slot: "B",
    name: "Accelerated Electrification",
    summary: "More vehicles replaced early to reduce fuel use and operating emissions sooner.",
    electric: 8,
    diesel: 2,
    chargers: 8,
    tco: 3_860_000,
    capex: 1_520_000,
    opex: 344_000,
    emissions: 221,
    peakPower: 760,
    feasibility: "Near site capacity",
    feasibilityDetail: "Feasible, but charger scheduling would be important during the overnight peak.",
    roadmap: [3, 2, 2, 1, 1, 1, 0, 0, 0, 0],
    cumulativeCost: [660, 1170, 1600, 1970, 2310, 2640, 2950, 3260, 3560, 3860],
  },
];

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="rounded-lg border border-line bg-control px-3 py-3">
    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-secondary">{label}</p>
    <p className="mt-1 text-lg font-semibold text-primary">{value}</p>
    {detail && <p className="mt-1 text-[11px] leading-relaxed text-secondary">{detail}</p>}
  </div>;
}

function PlanColumn({ plan }: { plan: DemoPlan }) {
  const [cameraReset, setCameraReset] = useState(0);

  return <article className="min-w-[520px] flex-1 overflow-hidden rounded-xl border border-line-strong bg-panel shadow-[0_18px_70px_rgba(0,0,0,0.18)]">
    <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-accent">Plan {plan.slot}</p>
          <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-secondary">2030 view</span>
        </div>
        <h3 className="mt-1 truncate text-xl font-semibold" title={plan.name}>{plan.name}</h3>
        <p className="mt-1 max-w-[620px] text-xs leading-relaxed text-secondary">{plan.summary}</p>
      </div>
      <button type="button" className="min-h-9 shrink-0 rounded border border-line-strong px-3 text-xs font-bold text-secondary hover:border-accent hover:text-primary" onClick={() => setCameraReset((value) => value + 1)}>Reset view</button>
    </div>

    <div className="relative h-[350px] border-b border-line bg-surface">
      <ComparisonViewport plan={plan.key} reset={cameraReset} />
      <div className="pointer-events-none absolute left-3 top-3 flex gap-2">
        <span className="rounded border border-line-strong bg-panel/90 px-2 py-1 font-mono text-[10px] text-secondary backdrop-blur">Sample depot</span>
        <span className="rounded border border-line-strong bg-panel/90 px-2 py-1 font-mono text-[10px] text-secondary backdrop-blur">10 parked vehicles</span>
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-3 rounded border border-line-strong bg-panel/90 px-3 py-2 text-[10px] text-secondary backdrop-blur">
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#3b82f6]" /> Electric</span>
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#22c55e]" /> Diesel</span>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-2 p-4">
      <Metric label="Fleet mix" value={`${plan.electric} electric`} detail={`${plan.diesel} diesel`} />
      <Metric label="Chargers" value={String(plan.chargers)} detail="Installed at the depot" />
      <Metric label="Peak power" value={`${number.format(plan.peakPower)} kW`} detail="800 kW site capacity" />
      <Metric label="10-year TCO" value={currency.format(plan.tco)} detail="Illustrative whole-fleet cost" />
      <Metric label="Transition CAPEX" value={currency.format(plan.capex)} detail="Vehicles + charging infrastructure" />
      <Metric label="Annual OPEX" value={currency.format(plan.opex)} detail="Energy + operating cost" />
      <Metric label="10-year emissions" value={`${number.format(plan.emissions)} tCO₂e`} detail="Operational fleet emissions" />
      <Metric label="Vehicles transitioned" value={`${plan.electric} / 10`} detail="By the selected year" />
      <div className="rounded-lg border border-[#355149] bg-[#0f211d] px-3 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-secondary">Feasibility</p>
        <p className="mt-1 text-sm font-semibold text-accent">{plan.feasibility}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-secondary">{plan.feasibilityDetail}</p>
      </div>
    </div>
  </article>;
}

function Delta({ label, a, b, format }: { label: string; a: number; b: number; format: (value: number) => string }) {
  const delta = b - a;
  return <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line py-3 last:border-b-0">
    <div>
      <p className="text-sm font-semibold text-primary">{label}</p>
      <p className="mt-0.5 text-[11px] text-secondary">Plan B compared with Plan A</p>
    </div>
    <span className="font-mono text-sm font-semibold tabular-nums text-primary">{delta === 0 ? "No change" : `${delta > 0 ? "+" : "−"}${format(Math.abs(delta))}`}</span>
  </div>;
}

export function CompareWorkspace() {
  const [planA, planB] = PLANS;

  const chartOption = {
    animation: false,
    tooltip: { trigger: "axis" },
    legend: { data: [planA.name, planB.name], textStyle: { color: "#b1c3bd" } },
    grid: { left: 58, right: 22, top: 42, bottom: 40 },
    xAxis: { type: "category", data: YEARS, axisLine: { lineStyle: { color: "#405a53" } }, axisLabel: { color: "#b1c3bd" } },
    yAxis: { type: "value", axisLabel: { color: "#b1c3bd", formatter: (value: number | string) => `$${Number(value) / 1000}m` }, splitLine: { lineStyle: { color: "#273a35" } } },
    series: [
      { name: planA.name, type: "line", smooth: true, symbolSize: 6, data: planA.cumulativeCost, lineStyle: { width: 3 } },
      { name: planB.name, type: "line", smooth: true, symbolSize: 6, data: planB.cumulativeCost, lineStyle: { width: 3 } },
    ],
  };

  return <section id="compare-workspace" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto bg-surface px-[clamp(16px,2.5vw,34px)] py-5">
    <div className="mx-auto grid w-full max-w-[1680px] gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-line-strong bg-panel px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Scenario comparison</p>
            <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-secondary">Client demo</span>
          </div>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.025em]">Two possible fleet transition plans</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-secondary">Both plans use the same depot and fleet. The comparison shows how different transition speeds could affect cost, emissions, charging demand, and the physical depot layout.</p>
        </div>
        <div className="rounded-lg border border-line bg-control px-4 py-3 text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-secondary">Selected year</p>
          <p className="mt-0.5 font-mono text-xl font-semibold text-primary">2030</p>
        </div>
      </header>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-4 xl:min-w-0">
          <PlanColumn plan={planA} />
          <PlanColumn plan={planB} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-xl border border-line-strong bg-panel p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Difference</p>
          <h3 className="mt-1 text-lg font-semibold">Plan B minus Plan A</h3>
          <p className="mt-1 text-xs text-secondary">A quick summary of the trade-offs between the two sample plans.</p>
          <div className="mt-4">
            <Delta label="10-year TCO" a={planA.tco} b={planB.tco} format={(value) => currency.format(value)} />
            <Delta label="Transition CAPEX" a={planA.capex} b={planB.capex} format={(value) => currency.format(value)} />
            <Delta label="Annual OPEX" a={planA.opex} b={planB.opex} format={(value) => currency.format(value)} />
            <Delta label="10-year emissions" a={planA.emissions} b={planB.emissions} format={(value) => `${number.format(value)} tCO₂e`} />
            <Delta label="Peak demand" a={planA.peakPower} b={planB.peakPower} format={(value) => `${number.format(value)} kW`} />
            <Delta label="Chargers" a={planA.chargers} b={planB.chargers} format={(value) => number.format(value)} />
          </div>
        </article>

        <article className="rounded-xl border border-line-strong bg-panel p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Cost over time</p>
          <h3 className="mt-1 text-lg font-semibold">Cumulative fleet cost</h3>
          <p className="mt-1 text-xs text-secondary">The accelerated plan starts with higher investment, then benefits from lower ongoing operating cost.</p>
          <div className="mt-3 h-[360px]"><ReactECharts option={chartOption} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate opts={{ renderer: "svg" }} /></div>
        </article>
      </div>

      <article className="rounded-xl border border-line-strong bg-panel p-5">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Transition roadmap</p>
          <h3 className="mt-1 text-lg font-semibold">Vehicles replaced each year</h3>
          <p className="mt-1 text-xs text-secondary">An example of how the transition timing could differ even when both plans start from the same fleet.</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-xs">
            <thead><tr><th className="border-b border-line p-2 text-left text-secondary">Scenario</th>{YEARS.map((year) => <th key={year} className={`border-b border-line p-2 text-center ${year === 2030 ? "text-accent" : "text-secondary"}`}>{year}</th>)}</tr></thead>
            <tbody>
              {PLANS.map((plan) => <tr key={plan.key}><th className="border-b border-line p-2 text-left font-semibold text-primary">{plan.name}</th>{plan.roadmap.map((count, index) => <td key={YEARS[index]} className={`border-b border-line p-2 text-center font-mono ${count ? "text-primary" : "text-secondary"}`}>{count || "—"}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  </section>;
}
