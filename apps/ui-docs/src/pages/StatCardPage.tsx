import { StatCard } from "@chargedup/ui";
import { PageHeading, ImportBanner, SectionHeading } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "label", type: "ReactNode", required: true, description: "Short label describing the metric." },
  { name: "value", type: "ReactNode", required: true, description: "The primary value shown large (kpi) or inline (compact)." },
  { name: "caption", type: "ReactNode", description: "Optional supporting text beneath the value." },
  { name: "density", type: '"kpi" | "compact"', default: '"kpi"', description: "Card layout for dashboards (kpi) or dense metric lists (compact)." },
  { name: "className", type: "string", description: "Extra classes appended to the container." },
  { name: "...rest", type: 'ComponentPropsWithoutRef<"div">', description: "All native div props are forwarded." },
];

export function StatCardPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Stat Card"
        description="A labelled metric tile. Use the kpi density for summary dashboards and the compact density for dense metric rows inside panels."
      />
      <ImportBanner importStr='import { StatCard, type StatCardDensity } from "@chargedup/ui";' />

      <SectionHeading>Density</SectionHeading>

      <ComponentSection
        title="KPI cards"
        description="Big-number cards for at-a-glance summaries, typically arranged in a responsive grid."
        preview={
          <LivePreview className="gap-4">
            <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total cost" value="$128k" caption="over 5 years" />
              <StatCard label="Vehicles" value={12} caption="4 electric" />
              <StatCard label="CO₂ saved" value="8.4t" caption="vs diesel" />
              <StatCard label="Peak power" value="240 kW" caption="depot draw" />
            </div>
          </LivePreview>
        }
        code={`<StatCard label="Total cost" value="$128k" caption="over 5 years" />
<StatCard label="Vehicles" value={12} caption="4 electric" />`}
        props={props}
      />

      <ComponentSection
        title="Compact metrics"
        description="Single label/value rows for dense panels, such as a comparison column."
        preview={
          <LivePreview className="gap-4">
            <div className="grid w-full max-w-sm gap-1">
              <StatCard density="compact" label="Purchase price" value="$52,000" />
              <StatCard density="compact" label="Fuel / energy" value="18 kWh/100km" />
              <StatCard density="compact" label="Range" value="220 km" />
              <StatCard density="compact" label="Charging power" value="50 kW" />
            </div>
          </LivePreview>
        }
        code={`<StatCard density="compact" label="Range" value="220 km" />
<StatCard density="compact" label="Charging power" value="50 kW" />`}
      />
    </div>
  );
}
