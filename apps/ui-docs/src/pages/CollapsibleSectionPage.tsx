import { CollapsibleSection, Input, Select } from "@chargedup/ui";
import { PageHeading, ImportBanner } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { AppPreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "title", type: "string", required: true, description: "Heading text on the accordion trigger." },
  { name: "description", type: "string", description: "Optional muted paragraph at the top of the expanded body." },
  { name: "defaultOpen", type: "boolean", default: "false", description: "Whether the section starts expanded." },
  { name: "variant", type: '"light" | "dark"', default: '"light"', description: "Surface style — light for white surfaces, dark for Night Blue." },
  { name: "onBeforeCollapse", type: "() => void", description: "Called just before the section collapses. Useful to commit edits before hiding controls." },
  { name: "children", type: "ReactNode", required: true, description: "Content revealed when expanded." },
];

export function CollapsibleSectionPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Collapsible Section"
        description="Accordion section used in the ChargedUp product sidebar. Fully accessible via aria-expanded / aria-controls / role=region."
      />
      <ImportBanner importStr='import { CollapsibleSection, type CollapsibleSectionProps } from "@chargedup/ui";' />

      <ComponentSection
        title="Light variant (default)"
        description="Stack multiple sections — they share top borders, creating a connected accordion feel."
        preview={
          <AppPreview className="overflow-hidden rounded-xl border border-chargedup-night/10 !p-0">
            <CollapsibleSection title="Inspector" defaultOpen description="Edit the selected object's properties.">
              <div className="grid gap-4">
                <Input label="Object name" defaultValue="Van A" />
                <Select label="Material">
                  <option>Default</option>
                  <option>Matte</option>
                  <option>Glossy</option>
                </Select>
              </div>
            </CollapsibleSection>
            <CollapsibleSection title="Scene">
              <p className="font-body text-sm text-chargedup-night/65">Light intensity and camera controls appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection title="Debug">
              <p className="font-body text-sm text-chargedup-night/65">Read-only scene document JSON.</p>
            </CollapsibleSection>
          </AppPreview>
        }
        code={`<CollapsibleSection title="Inspector" defaultOpen description="Edit the selected object's properties.">
  <Input label="Object name" defaultValue="Van A" />
  <Select label="Material">
    <option>Default</option>
  </Select>
</CollapsibleSection>

<CollapsibleSection title="Scene">
  {/* content */}
</CollapsibleSection>`}
        props={props}
      />

      <ComponentSection
        title="Dark variant"
        preview={
          <div className="overflow-hidden rounded-xl bg-chargedup-night">
            <CollapsibleSection title="Fleet Management" variant="dark" defaultOpen>
              <p className="font-body text-sm text-chargedup-white/60">Vehicle list and transition assignments go here.</p>
            </CollapsibleSection>
            <CollapsibleSection title="Simulation Settings" variant="dark">
              <p className="font-body text-sm text-chargedup-white/60">Analysis period and emissions factors.</p>
            </CollapsibleSection>
          </div>
        }
        code={`<CollapsibleSection title="Fleet Management" variant="dark" defaultOpen>
  {/* content */}
</CollapsibleSection>`}
      />
    </div>
  );
}
