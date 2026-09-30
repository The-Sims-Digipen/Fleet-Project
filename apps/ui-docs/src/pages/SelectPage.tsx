import { Select } from "@chargedup/ui";
import { PageHeading, ImportBanner } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "label", type: "string", required: true, description: "Visible label above the select." },
  { name: "helperText", type: "string", description: "Supplementary hint shown below." },
  { name: "error", type: "string", description: "Error message with red border and role=alert." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the select." },
  { name: "children", type: "ReactNode", required: true, description: "<option> elements to render." },
  { name: "ref", type: "Ref<HTMLSelectElement>", description: "Forwarded DOM ref." },
  { name: "...rest", type: "ComponentPropsWithoutRef<\"select\">", description: "All native select props are forwarded." },
];

export function SelectPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Select"
        description="Dropdown selector with the same label/error API as Input. Uses a styled native <select> for maximum browser compatibility."
      />
      <ImportBanner importStr='import { Select, type SelectProps } from "@chargedup/ui";' />

      <ComponentSection
        title="States"
        preview={
          <LivePreview className="flex-col items-stretch gap-5 max-w-sm">
            <Select label="Propulsion type">
              <option value="">Select type…</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
              <option value="diesel">Diesel</option>
            </Select>
            <Select label="Transition year" helperText="Vehicles without a year remain on their current preset.">
              {[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
            <Select label="Charging strategy" error="A charging strategy is required.">
              <option value="">Select strategy…</option>
              <option value="depot">Depot only</option>
              <option value="external">External network</option>
              <option value="mixed">Mixed</option>
            </Select>
            <Select label="Analysis period" disabled>
              <option>5 years</option>
            </Select>
          </LivePreview>
        }
        code={`<Select label="Propulsion type">
  <option value="electric">Electric</option>
  <option value="hybrid">Hybrid</option>
  <option value="diesel">Diesel</option>
</Select>

<Select label="Transition year" helperText="Vehicles without a year remain on their current preset.">
  {years.map((y) => <option key={y} value={y}>{y}</option>)}
</Select>

<Select label="Charging strategy" error="A charging strategy is required.">
  <option value="depot">Depot only</option>
</Select>`}
        props={props}
      />
    </div>
  );
}
