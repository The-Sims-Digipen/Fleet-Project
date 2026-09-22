import { Button } from "@chargedup/ui";
import { PageHeading, ImportBanner, SectionHeading } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview, DarkPreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "variant", type: '"primary" | "secondary" | "ghost" | "danger"', default: '"primary"', description: "Visual style of the button." },
  { name: "disabled", type: "boolean", default: "false", description: "Prevents interaction and applies reduced opacity." },
  { name: "type", type: '"button" | "submit" | "reset"', default: '"button"', description: "Native button type. Set to submit inside forms." },
  { name: "className", type: "string", description: "Extra classes appended to the button — useful for width overrides." },
  { name: "ref", type: "Ref<HTMLButtonElement>", description: "Forwarded DOM ref." },
  { name: "...rest", type: "ComponentPropsWithoutRef<\"button\">", description: "All native button props are forwarded." },
];

export function ButtonPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Button"
        description="The primary interactive element. Follows BrandBook colour roles: Gold for primary actions, Night Blue for secondary, transparent for ghost, and red for destructive actions."
      />
      <ImportBanner importStr='import { Button, type ButtonVariant } from "@chargedup/ui";' />

      <SectionHeading>Variants</SectionHeading>

      <ComponentSection
        title="On light surface"
        preview={
          <LivePreview>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </LivePreview>
        }
        code={`<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>`}
        props={props}
      />

      <ComponentSection
        title="On dark surface"
        description="Ghost adapts to the current text colour — use it on dark backgrounds."
        preview={
          <DarkPreview>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button
              variant="ghost"
              className="text-chargedup-white hover:bg-chargedup-white/10"
            >
              Ghost
            </Button>
            <Button variant="danger">Danger</Button>
          </DarkPreview>
        }
        code={`<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost" className="text-chargedup-white hover:bg-chargedup-white/10">Ghost</Button>
<Button variant="danger">Danger</Button>`}
      />

      <ComponentSection
        title="Disabled states"
        preview={
          <LivePreview>
            {(["primary", "secondary", "ghost", "danger"] as const).map((v) => (
              <Button key={v} variant={v} disabled>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Button>
            ))}
          </LivePreview>
        }
        code={`<Button variant="primary" disabled>Primary</Button>
<Button variant="secondary" disabled>Secondary</Button>
<Button variant="ghost" disabled>Ghost</Button>
<Button variant="danger" disabled>Danger</Button>`}
      />

      <ComponentSection
        title="Full width"
        preview={
          <LivePreview className="flex-col">
            <Button variant="primary" className="w-full">
              Confirm transition plan
            </Button>
          </LivePreview>
        }
        code={`<Button variant="primary" className="w-full">
  Confirm transition plan
</Button>`}
      />

      <ComponentSection
        title="Inside a form"
        preview={
          <LivePreview>
            <form onSubmit={(e) => e.preventDefault()}>
              <Button type="submit" variant="primary">
                Save changes
              </Button>
            </form>
          </LivePreview>
        }
        code={`<form onSubmit={handleSubmit}>
  <Button type="submit" variant="primary">
    Save changes
  </Button>
</form>`}
      />
    </div>
  );
}
