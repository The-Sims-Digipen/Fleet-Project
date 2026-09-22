import { Input } from "@chargedup/ui";
import { PageHeading, ImportBanner, SectionHeading } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "label", type: "string", required: true, description: "Visible label above the input. Also used for accessibility." },
  { name: "helperText", type: "string", description: "Supplementary hint shown below in muted text." },
  { name: "error", type: "string", description: "Error message. When set, the input border turns red and the message has role=alert." },
  { name: "leadingAdornment", type: "ReactNode", description: "Icon or text rendered at the start of the input." },
  { name: "trailingAdornment", type: "ReactNode", description: "Icon or text rendered at the end of the input." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the input." },
  { name: "ref", type: "Ref<HTMLInputElement>", description: "Forwarded DOM ref." },
  { name: "...rest", type: "ComponentPropsWithoutRef<\"input\">", description: "All native input props are forwarded." },
];

export function InputPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Input"
        description="Text input field with label, helper text, error state, and adornment slots. Fully accessible — error messages use role=alert; helper text is linked via aria-describedby."
      />
      <ImportBanner importStr='import { Input, type InputProps } from "@chargedup/ui";' />

      <SectionHeading>States</SectionHeading>

      <ComponentSection
        title="Default, helper text, error"
        preview={
          <LivePreview className="flex-col items-stretch gap-5 max-w-sm max-h-[480px] overflow-y-auto">
            <Input label="Project name" placeholder="Enter project name" />
            <Input label="Vehicle ID" helperText="Use the format FLT-000." placeholder="FLT-001" />
            <Input label="Annual mileage" error="Must be a positive number." defaultValue="-500" />
          </LivePreview>
        }
        code={`<Input label="Project name" placeholder="Enter project name" />
<Input label="Vehicle ID" helperText="Use the format FLT-000." placeholder="FLT-001" />
<Input label="Annual mileage" error="Must be a positive number." />`}
        props={props}
      />

      <ComponentSection
        title="With adornments"
        preview={
          <LivePreview className="flex-col items-stretch gap-5 max-w-sm max-h-[480px] overflow-y-auto">
            <Input
              label="Daily distance"
              trailingAdornment={<span className="font-body text-sm">km</span>}
              placeholder="0"
              type="number"
            />
            <Input
              label="Search vehicles"
              leadingAdornment={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              }
              placeholder="Fleet-001…"
            />
          </LivePreview>
        }
        code={`<Input
  label="Daily distance"
  trailingAdornment={<span>km</span>}
  placeholder="0"
  type="number"
/>
<Input
  label="Search vehicles"
  leadingAdornment={<SearchIcon />}
  placeholder="Fleet-001…"
/>`}
      />

      <ComponentSection
        title="Disabled"
        preview={
          <LivePreview className="max-w-sm">
            <Input label="Read-only field" value="Locked value" disabled className="w-full" readOnly />
          </LivePreview>
        }
        code={`<Input label="Read-only field" value="Locked value" disabled />`}
      />
    </div>
  );
}
