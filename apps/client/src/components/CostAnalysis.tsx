import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { CollapsibleSection } from "./CollapsibleSection";

const years = [2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036];
const baseline = [0, 110, 220, 335, 450, 565, 680, 800, 920, 1040];
const transition = [0, 140, 290, 420, 520, 585, 610, 630, 650, 670];
const breakEvenYear = 2033;
const endSavings = baseline[baseline.length - 1] - transition[transition.length - 1];
const annualBaseline = baseline.map((value, index) => index === 0 ? value : value - baseline[index - 1]);
const annualTransition = transition.map((value, index) => index === 0 ? value : value - transition[index - 1]);
const annualNetSavings = annualBaseline.map((value, index) => value - annualTransition[index]);
const annualCashFlowOption: EChartsOption = {
  animationDuration: 500,
  aria: { enabled: true },
  grid: { left: 72, right: 18, top: 18, bottom: 34, containLabel: true },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, backgroundColor: "#10201d", borderColor: "#405a53", textStyle: { color: "#eef7f3" }, formatter: (params) => { const item = Array.isArray(params) ? params[0] : params; return `<strong>${item?.name ?? ""}</strong><br />${item?.marker ?? ""}Net annual saving: <strong>$${item?.value ?? 0}k</strong>`; } },
  xAxis: { type: "category", data: years, axisLine: { lineStyle: { color: "#405a53" } }, axisLabel: { color: "#b1c3bd", fontSize: 10 } },
  yAxis: { type: "value", name: "SGD thousands", nameLocation: "middle", nameGap: 42, nameTextStyle: { color: "#b1c3bd", fontSize: 15 }, axisLabel: { color: "#b1c3bd", fontSize: 10, margin: 8, formatter: "${value}k" }, splitLine: { lineStyle: { color: "#273a35" } } },
  series: [{ name: "Net annual saving", type: "bar", barMaxWidth: 24, data: annualNetSavings.map((value) => ({ value, itemStyle: { color: value >= 0 ? "#55d6be" : "#d58b79" } })), markLine: { symbol: "none", lineStyle: { color: "#a7b8b2", type: "dashed" }, data: [{ yAxis: 0 }] } }],
};

const chartOption: EChartsOption = {
  animationDuration: 500,
  aria: { enabled: true, decal: { show: true } },
  color: ["#a7b8b2", "#55d6be"],
  grid: { left: 52, right: 18, top: 42, bottom: 72, containLabel: true },
  legend: { bottom: 4, left: "center", itemWidth: 14, itemHeight: 8, textStyle: { color: "#b1c3bd", fontSize: 11 }, data: ["Current fleet baseline", "EV transition plan"] },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "line", lineStyle: { color: "#55d6be", type: "dashed" } },
    backgroundColor: "#10201d",
    borderColor: "#405a53",
    textStyle: { color: "#eef7f3" },
    formatter: (params) => {
      const items = Array.isArray(params) ? params : [params];
      const year = items[0]?.name ?? "";
      return [`<strong>${year}</strong>`, ...items.map((item) => `${item.marker}${item.seriesName}: <strong>$${item.value}k</strong>`)].join("<br />");
    },
  },
  toolbox: { right: 0, top: 0, itemSize: 14, iconStyle: { borderColor: "#b1c3bd" }, emphasis: { iconStyle: { borderColor: "#55d6be" } }, feature: { dataZoom: { yAxisIndex: "none", title: { zoom: "Zoom", back: "Reset zoom" } }, restore: { title: "Reset chart" } } },
  xAxis: { type: "category",  boundaryGap: false, data: years, axisLine: { lineStyle: { color: "#405a53" } }, axisLabel: { color: "#b1c3bd", fontSize: 10 } },
  yAxis: { type: "value", name: "SGD thousands", nameLocation: "middle", nameGap: 42,   nameTextStyle: { color: "#b1c3bd", fontSize: 15, padding: [0, 0, 8, 0] }, axisLabel: { color: "#b1c3bd", fontSize: 10, formatter: "${value}k" }, splitLine: { lineStyle: { color: "#273a35" } } },
  dataZoom: [
    { type: "inside", xAxisIndex: 0, filterMode: "none", zoomOnMouseWheel: true, moveOnMouseMove: true },
    { type: "slider", xAxisIndex: 0, height: 14, bottom: 34, borderColor: "#405a53", backgroundColor: "#101e1b", fillerColor: "#355149", handleStyle: { color: "#55d6be" }, textStyle: { color: "#b1c3bd", fontSize: 9 } },
  ],
  series: [
    { name: "Current fleet baseline", type: "line", smooth: true, symbol: "circle", symbolSize: 7, data: baseline, lineStyle: { width: 3 }, emphasis: { focus: "series", scale: true } },
    {
      name: "EV transition plan", type: "line", smooth: true, symbol: "circle", symbolSize: 7, data: transition, lineStyle: { width: 3 }, areaStyle: { color: "rgba(85, 214, 190, 0.08)" }, emphasis: { focus: "series", scale: true },
      markLine: { symbol: "none", lineStyle: { color: "#55d6be", type: "dashed", width: 1.5 }, label: { color: "#06231d", backgroundColor: "#55d6be", padding: [4, 6], borderRadius: 4, formatter: `Payback ${breakEvenYear}` }, data: [{ xAxis: breakEvenYear }] },
      markPoint: { symbol: "pin", symbolSize: 42, itemStyle: { color: "#55d6be" }, label: { color: "#06231d", fontWeight: "bold", formatter: `${endSavings}k` }, data: [{ coord: [2036, 670], name: `${endSavings}k saved` }] },
    },
  ],
};

export function CostAnalysis() {
  return <CollapsibleSection title="Cost over time" description="Mocked fleet cost comparison. Lower is better." defaultOpen>
    <div className="grid grid-cols-2 gap-3">
      <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">Payback year</p><p className="mt-2 text-2xl font-semibold">{breakEvenYear}</p><p className="mt-1 text-xs text-secondary">Transition becomes cheaper</p></article>
      <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">10-year saving</p><p className="mt-2 text-2xl font-semibold">${endSavings}k</p><p className="mt-1 text-xs text-secondary">Compared with no transition</p></article>
      <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">2036 cost</p><p className="mt-2 text-2xl font-semibold">${transition[transition.length - 1]}k</p><p className="mt-1 text-xs text-secondary">EV transition plan</p></article>
      <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">Planning status</p><p className="mt-2 text-2xl font-semibold text-accent">Profitable</p><p className="mt-1 text-xs text-secondary">Based on mocked assumptions</p></article>
    </div>
    <div className="mt-4 rounded-lg border border-line bg-panel p-2">
      <h3 className="px-2 pt-1 text-base font-semibold">Cumulative operating cost</h3>
      <p className="px-2 pt-1 text-xs text-secondary">Hover a year for exact values. Drag the timeline or use the mouse wheel to zoom.</p>
      <div className="mt-2 h-[460px] w-full" role="img" aria-label="Interactive cumulative cost comparison chart from 2027 to 2036">
        <ReactECharts option={chartOption} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate opts={{ renderer: "svg" }} />
      </div>
    </div>
    <div className="mt-4 rounded-lg border border-line bg-panel p-2">
      <h3 className="px-2 pt-1 text-base font-semibold">Annual net cash flow</h3>
      <p className="px-2 pt-1 text-xs text-secondary">Red bars show extra transition cost; green bars show annual savings.</p>
      <div className="mt-2 h-[280px] w-full" role="img" aria-label="Annual net cash flow chart from 2027 to 2036">
        <ReactECharts option={annualCashFlowOption} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate opts={{ renderer: "svg" }} />
      </div>
    </div>
    <p className="mt-2 border-t border-line pt-4 text-xs leading-relaxed text-secondary"><strong className="text-accent">How to read this:</strong> The plan costs more during the transition, crosses below the current fleet in {breakEvenYear}, and saves ${endSavings}k by 2036. Values are illustrative and will be replaced by simulation results.</p>
  </CollapsibleSection>;
}
