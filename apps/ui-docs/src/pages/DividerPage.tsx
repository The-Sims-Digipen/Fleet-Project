import { Divider } from "@chargedup/ui";
import { PageHeading, ImportBanner } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "label", type: "string", description: "Optional centred text label on the divider." },
  { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Axis of the divider." },
  { name: "className", type: "string", description: "Extra classes." },
];

export function DividerPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Divider"
        description="Horizontal or vertical rule using the chargedup-night/10 colour token."
      />
      <ImportBanner importStr='import { Divider, type DividerProps } from "@chargedup/ui";' />

      <ComponentSection
        title="Horizontal"
        preview={
          <LivePreview className="flex-col items-stretch w-full gap-4">
            <p className="font-body text-sm text-chargedup-night/70">Above the divider</p>
            <Divider />
            <p className="font-body text-sm text-chargedup-night/70">Below the divider</p>
          </LivePreview>
        }
        code={`<p>Above</p>
<Divider />
<p>Below</p>`}
        props={props}
      />

      <ComponentSection
        title="With label"
        preview={
          <LivePreview className="flex-col items-stretch w-full">
            <Divider label="or" />
          </LivePreview>
        }
        code={`<Divider label="or" />`}
      />

      <ComponentSection
        title="Vertical"
        preview={
          <LivePreview className="items-center h-10">
            <span className="font-body text-sm">Item A</span>
            <Divider orientation="vertical" />
            <span className="font-body text-sm">Item B</span>
            <Divider orientation="vertical" />
            <span className="font-body text-sm">Item C</span>
          </LivePreview>
        }
        code={`<span>Item A</span>
<Divider orientation="vertical" />
<span>Item B</span>`}
      />
    </div>
  );
}
