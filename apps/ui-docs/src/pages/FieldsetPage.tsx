import { Fieldset, Input, Select } from "@chargedup/ui";
import { PageHeading, ImportBanner, SectionHeading } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "title", type: "ReactNode", required: true, description: "Section title, rendered as the legend and announced as the group's name." },
  { name: "description", type: "ReactNode", description: "Optional supporting text shown beneath the title." },
  { name: "children", type: "ReactNode", required: true, description: "The grouped form controls, laid out in a vertical stack." },
  { name: "className", type: "string", description: "Extra classes appended to the fieldset." },
  { name: "...rest", type: 'ComponentPropsWithoutRef<"fieldset">', description: "Remaining native fieldset props are forwarded." },
];

export function FieldsetPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Fieldset"
        description="A titled form section that groups related controls. Built on a native fieldset and legend, so the title becomes the accessible group name for every control inside it."
      />
      <ImportBanner importStr='import { Fieldset } from "@chargedup/ui";' />

      <SectionHeading>Examples</SectionHeading>

      <ComponentSection
        title="Grouped controls"
        description="Wrap related inputs in a Fieldset. Nest a grid inside to place fields side by side."
        preview={
          <LivePreview className="flex-col">
            <div className="grid w-full max-w-md gap-5">
              <Fieldset title="Identity" description="How this preset appears across the editor.">
                <Input label="Preset name" defaultValue="Electric Delivery Van" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Category" defaultValue="Van" />
                  <Select label="Propulsion" defaultValue="electric">
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </Select>
                </div>
              </Fieldset>
            </div>
          </LivePreview>
        }
        code={`<Fieldset title="Identity" description="How this preset appears across the editor.">
  <Input label="Preset name" defaultValue="Electric Delivery Van" />
  <div className="grid grid-cols-2 gap-4">
    <Input label="Category" defaultValue="Van" />
    <Select label="Propulsion" defaultValue="electric">…</Select>
  </div>
</Fieldset>`}
        props={props}
      />
    </div>
  );
}
