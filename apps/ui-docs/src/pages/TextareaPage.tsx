import { Textarea } from "@chargedup/ui";
import { PageHeading, ImportBanner } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "label", type: "string", required: true, description: "Visible label above the textarea." },
  { name: "helperText", type: "string", description: "Supplementary hint shown below." },
  { name: "error", type: "string", description: "Error message with red border and role=alert." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the textarea." },
  { name: "ref", type: "Ref<HTMLTextAreaElement>", description: "Forwarded DOM ref." },
  { name: "...rest", type: "ComponentPropsWithoutRef<\"textarea\">", description: "All native textarea props are forwarded." },
];

export function TextareaPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Textarea"
        description="Multi-line text input. Vertically resizable by default. Shares the same label/error/helper API as Input."
      />
      <ImportBanner importStr='import { Textarea, type TextareaProps } from "@chargedup/ui";' />

      <ComponentSection
        title="States"
        preview={
          <LivePreview className="flex-col items-stretch gap-5 max-w-sm max-h-[480px] overflow-y-auto">
            <Textarea label="Scenario notes" placeholder="Add notes about this transition plan…" rows={3} />
            <Textarea label="Assumptions" helperText="Describe any non-standard assumptions used in this scenario." rows={3} />
            <Textarea label="Vehicle description" error="Description is required." rows={3} />
            <Textarea label="Locked notes" disabled defaultValue="This scenario is read-only." rows={2} />
          </LivePreview>
        }
        code={`<Textarea label="Scenario notes" placeholder="Add notes…" rows={3} />
<Textarea label="Assumptions" helperText="Describe any non-standard assumptions." rows={3} />
<Textarea label="Vehicle description" error="Description is required." rows={3} />
<Textarea label="Locked notes" disabled rows={2} />`}
        props={props}
      />
    </div>
  );
}
