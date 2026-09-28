import { useState } from "react";
import { Slider } from "@chargedup/ui";
import { PageHeading, ImportBanner, SectionHeading } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "value", type: "number", required: true, description: "Current value (controlled)." },
  { name: "min", type: "number", required: true, description: "Minimum value." },
  { name: "max", type: "number", required: true, description: "Maximum value." },
  { name: "step", type: "number", default: "1", description: "Increment between values." },
  { name: "onChange", type: "(value: number) => void", required: true, description: "Called with the parsed numeric value on change." },
  { name: "label", type: "ReactNode", description: "Visible label shown above the track." },
  { name: "unit", type: "string", default: '""', description: "Suffix appended to the value readout (e.g. \"%\")." },
  { name: "hideValue", type: "boolean", default: "false", description: "Hide the numeric readout beside the label." },
  { name: "...rest", type: 'ComponentPropsWithoutRef<"input">', description: "Remaining native input props are forwarded." },
];

function DemoSlider() {
  const [value, setValue] = useState(40);
  return <Slider label="Charging power" value={value} min={0} max={150} step={5} unit=" kW" onChange={setValue} />;
}

function DemoPercent() {
  const [value, setValue] = useState(65);
  return <Slider label="Battery target" value={value} min={0} max={100} unit="%" onChange={setValue} />;
}

export function SliderPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Slider"
        description="A themed range input with a value readout and a filled track. Controlled: pass value and onChange. The track and thumb are styled by the library's theme.css via the cu-range class the component applies."
      />
      <ImportBanner importStr='import { Slider } from "@chargedup/ui";' />

      <SectionHeading>Examples</SectionHeading>

      <ComponentSection
        title="With unit readout"
        description="The value and unit are shown opposite the label and update as the thumb moves."
        preview={
          <LivePreview className="flex-col gap-6">
            <div className="w-full max-w-md"><DemoSlider /></div>
            <div className="w-full max-w-md"><DemoPercent /></div>
          </LivePreview>
        }
        code={`const [value, setValue] = useState(40);

<Slider label="Charging power" value={value} min={0} max={150} step={5} unit=" kW" onChange={setValue} />`}
        props={props}
      />
    </div>
  );
}
