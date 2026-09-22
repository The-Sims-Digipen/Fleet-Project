import { ProgressBar } from "@chargedup/ui";
import { PageHeading, ImportBanner, SectionHeading } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "value", type: "number", required: true, description: "Current value; clamped to the [0, max] range." },
  { name: "max", type: "number", default: "100", description: "Value the bar fills to." },
  { name: "label", type: "ReactNode", description: "Optional label shown above the track." },
  { name: "valueLabel", type: "ReactNode", description: "Optional readout shown opposite the label." },
  { name: "tone", type: '"accent" | "success" | "warning" | "danger"', default: '"accent"', description: "Fill colour tone." },
  { name: "className", type: "string", description: "Extra classes appended to the container." },
];

export function ProgressBarPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Progress Bar"
        description="A labelled horizontal meter. Exposes the progressbar role with aria-value attributes for assistive tech, and clamps its fill to the valid range."
      />
      <ImportBanner importStr='import { ProgressBar, type ProgressBarTone } from "@chargedup/ui";' />

      <SectionHeading>Examples</SectionHeading>

      <ComponentSection
        title="Labelled cost split"
        description="Two bars comparing diesel and electric running costs, sharing a common max."
        preview={
          <LivePreview className="flex-col gap-4">
            <div className="grid w-full max-w-md gap-4">
              <ProgressBar tone="warning" value={7200} max={9000} label="Diesel" valueLabel="$7,200" />
              <ProgressBar tone="success" value={3400} max={9000} label="Electric" valueLabel="$3,400" />
            </div>
          </LivePreview>
        }
        code={`<ProgressBar tone="warning" value={7200} max={9000} label="Diesel" valueLabel="$7,200" />
<ProgressBar tone="success" value={3400} max={9000} label="Electric" valueLabel="$3,400" />`}
        props={props}
      />

      <ComponentSection
        title="Tones"
        preview={
          <LivePreview className="flex-col gap-4">
            <div className="grid w-full max-w-md gap-4">
              <ProgressBar tone="accent" value={65} label="Accent" valueLabel="65%" />
              <ProgressBar tone="success" value={90} label="Success" valueLabel="90%" />
              <ProgressBar tone="warning" value={45} label="Warning" valueLabel="45%" />
              <ProgressBar tone="danger" value={20} label="Danger" valueLabel="20%" />
            </div>
          </LivePreview>
        }
        code={`<ProgressBar tone="accent" value={65} label="Accent" valueLabel="65%" />`}
      />
    </div>
  );
}
