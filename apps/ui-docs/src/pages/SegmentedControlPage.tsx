import { useState } from "react";
import { SegmentedControl } from "@chargedup/ui";
import { PageHeading, ImportBanner, SectionHeading } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "value", type: "T", required: true, description: "Currently selected value." },
  { name: "options", type: "SegmentedControlOption<T>[]", required: true, description: "The mutually-exclusive options. Each has value, label, optional ariaLabel and disabled." },
  { name: "onChange", type: "(value: T) => void", required: true, description: "Called with the newly selected value." },
  { name: "label", type: "string", description: "Accessible group label, applied as aria-label on the group." },
  { name: "className", type: "string", description: "Extra classes appended to the group container." },
];

type Mode = "translate" | "rotate" | "scale";

function DemoModes() {
  const [mode, setMode] = useState<Mode>("translate");
  return (
    <SegmentedControl<Mode>
      label="Transform mode"
      value={mode}
      onChange={setMode}
      options={[
        { value: "translate", label: "Move" },
        { value: "rotate", label: "Rotate" },
        { value: "scale", label: "Scale" },
      ]}
    />
  );
}

function DemoView() {
  const [view, setView] = useState("world");
  return (
    <SegmentedControl
      label="Browser view"
      value={view}
      onChange={setView}
      options={[
        { value: "world", label: "Worlds" },
        { value: "scenario", label: "Scenarios" },
      ]}
    />
  );
}

export function SegmentedControlPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Segmented Control"
        description="A row of mutually-exclusive options rendered as a single selector. Each option is a button that exposes its state via aria-pressed, matching the toggle semantics used across the product toolbars."
      />
      <ImportBanner importStr='import { SegmentedControl, type SegmentedControlOption } from "@chargedup/ui";' />

      <SectionHeading>Examples</SectionHeading>

      <ComponentSection
        title="Single select"
        description="Bind value/onChange to local state. The type parameter keeps the option values type-safe."
        preview={
          <LivePreview className="flex-col items-start gap-5">
            <DemoModes />
            <DemoView />
          </LivePreview>
        }
        code={`const [mode, setMode] = useState<Mode>("translate");

<SegmentedControl<Mode>
  label="Transform mode"
  value={mode}
  onChange={setMode}
  options={[
    { value: "translate", label: "Move" },
    { value: "rotate", label: "Rotate" },
    { value: "scale", label: "Scale" },
  ]}
/>`}
        props={props}
      />
    </div>
  );
}
