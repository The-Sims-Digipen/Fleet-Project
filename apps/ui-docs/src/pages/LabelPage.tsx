import { Label } from "@chargedup/ui";
import { PageHeading, ImportBanner } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "variant", type: '"eyebrow" | "section" | "caption"', default: '"eyebrow"', description: "Typography preset." },
  { name: "as", type: "ElementType", default: '"p"', description: "Rendered HTML element — use 'span', 'h2', 'label', etc. as needed." },
  { name: "className", type: "string", description: "Extra classes." },
  { name: "children", type: "ReactNode", required: true, description: "Label content." },
];

export function LabelPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Label"
        description="Polymorphic typography component for eyebrows, section labels, and captions. Encodes the BrandBook uppercase tracking patterns."
      />
      <ImportBanner importStr='import { Label, type LabelVariant } from "@chargedup/ui";' />

      <ComponentSection
        title="Variants"
        preview={
          <LivePreview className="flex-col items-start gap-5">
            <div>
              <Label variant="eyebrow">ChargedUp UI · Components</Label>
              <p className="mt-1 font-heading text-2xl text-chargedup-night">Clear components for confident action.</p>
            </div>
            <div>
              <Label variant="section">Montserrat · 700</Label>
              <p className="mt-1 font-heading text-lg text-chargedup-night">Energy that moves people.</p>
            </div>
            <div>
              <Label variant="caption">Danger is a functional UI token, not a BrandBook colour.</Label>
            </div>
          </LivePreview>
        }
        code={`// Eyebrow — blue, wide tracking, all-caps
<Label variant="eyebrow">ChargedUp UI · Components</Label>

// Section — night blue, medium tracking, all-caps
<Label variant="section">Montserrat · 700</Label>

// Caption — muted, small
<Label variant="caption">Danger is a functional UI token.</Label>`}
        props={props}
      />

      <ComponentSection
        title="Polymorphic — rendered as h2"
        preview={
          <LivePreview>
            <Label as="h2" variant="section">Fleet Management</Label>
          </LivePreview>
        }
        code={`<Label as="h2" variant="section">Fleet Management</Label>`}
      />
    </div>
  );
}
