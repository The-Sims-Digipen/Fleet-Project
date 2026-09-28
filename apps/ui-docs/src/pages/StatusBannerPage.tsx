import { StatusBanner } from "@chargedup/ui";
import { PageHeading, ImportBanner, SectionHeading } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "tone", type: '"ok" | "warning" | "danger" | "info"', default: '"info"', description: "Colour, icon, and ARIA role. The danger tone uses role=\"alert\"; others use role=\"status\"." },
  { name: "title", type: "ReactNode", description: "Optional bold lead-in before the message." },
  { name: "children", type: "ReactNode", required: true, description: "The banner message." },
  { name: "icon", type: "ReactNode", description: "Override the default per-tone glyph." },
  { name: "className", type: "string", description: "Extra classes appended to the container." },
];

export function StatusBannerPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Status Banner"
        description="A full-width strip that reflects a live computed condition, such as whether a depot's power draw is within its supply limit. Unlike Alert, it is not dismissible and switches to an assertive alert role when the tone is danger."
      />
      <ImportBanner importStr='import { StatusBanner, type StatusBannerTone } from "@chargedup/ui";' />

      <SectionHeading>Tones</SectionHeading>

      <ComponentSection
        title="All tones"
        preview={
          <LivePreview className="flex-col gap-3">
            <StatusBanner tone="ok" title="Within supply.">Peak draw 180 kW of 250 kW available.</StatusBanner>
            <StatusBanner tone="warning" title="Approaching limit.">Peak draw 235 kW of 250 kW available.</StatusBanner>
            <StatusBanner tone="danger" title="Exceeds supply.">Peak draw 310 kW of 250 kW available.</StatusBanner>
            <StatusBanner tone="info">Simulation uses the depot's default tariff.</StatusBanner>
          </LivePreview>
        }
        code={`<StatusBanner tone="ok" title="Within supply.">Peak draw 180 kW of 250 kW available.</StatusBanner>
<StatusBanner tone="danger" title="Exceeds supply.">Peak draw 310 kW of 250 kW available.</StatusBanner>`}
        props={props}
      />
    </div>
  );
}
