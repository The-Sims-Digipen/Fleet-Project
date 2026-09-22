import { Checkbox } from "@chargedup/ui";
import { PageHeading, ImportBanner } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "label", type: "string", required: true, description: "Visible text label rendered beside the checkbox." },
  { name: "helperText", type: "string", description: "Supplementary hint shown below." },
  { name: "error", type: "string", description: "Error message with red border and role=alert." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the checkbox." },
  { name: "checked", type: "boolean", description: "Controlled checked state." },
  { name: "defaultChecked", type: "boolean", description: "Uncontrolled initial state." },
  { name: "onChange", type: "ChangeEventHandler<HTMLInputElement>", description: "Change handler." },
  { name: "ref", type: "Ref<HTMLInputElement>", description: "Forwarded DOM ref." },
];

export function CheckboxPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Checkbox"
        description="Accessible checkbox with a custom branded checkmark. Uses CSS background-image for the tick — no extra SVG DOM nodes."
      />
      <ImportBanner importStr='import { Checkbox, type CheckboxProps } from "@chargedup/ui";' />

      <ComponentSection
        title="States"
        preview={
          <LivePreview className="flex-col items-start gap-4">
            <Checkbox label="Include depot charger costs" defaultChecked />
            <Checkbox label="Apply fuel price inflation" />
            <Checkbox label="Show unscheduled vehicles" helperText="Vehicles with no transition plan stay on their current preset." />
            <Checkbox label="Read-only option" disabled defaultChecked />
            <Checkbox label="Required agreement" error="You must accept the terms to continue." />
          </LivePreview>
        }
        code={`<Checkbox label="Include depot charger costs" defaultChecked />
<Checkbox label="Apply fuel price inflation" />
<Checkbox
  label="Show unscheduled vehicles"
  helperText="Vehicles with no transition plan stay on their current preset."
/>
<Checkbox label="Read-only option" disabled defaultChecked />
<Checkbox label="Required agreement" error="You must accept the terms to continue." />`}
        props={props}
      />
    </div>
  );
}
