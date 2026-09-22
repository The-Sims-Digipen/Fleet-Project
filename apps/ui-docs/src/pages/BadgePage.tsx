import { Badge } from "@chargedup/ui";
import { PageHeading, ImportBanner, SectionHeading } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview, DarkPreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "variant", type: '"default" | "success" | "warning" | "danger" | "info"', default: '"default"', description: "Colour and semantic meaning of the badge." },
  { name: "className", type: "string", description: "Extra classes appended to the span element." },
  { name: "...rest", type: "ComponentPropsWithoutRef<\"span\">", description: "All native span props are forwarded." },
];

export function BadgePage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Badge"
        description="Compact pill label for status, categories, and metadata. Semantically a <span> — wrap in a context-bearing element if status must be announced to screen readers."
      />
      <ImportBanner importStr='import { Badge, type BadgeVariant } from "@chargedup/ui";' />

      <SectionHeading>Variants</SectionHeading>

      <ComponentSection
        title="All variants"
        preview={
          <LivePreview className="flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Active</Badge>
            <Badge variant="warning">Pending</Badge>
            <Badge variant="danger">Critical</Badge>
            <Badge variant="info">Info</Badge>
          </LivePreview>
        }
        code={`<Badge variant="default">Default</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Critical</Badge>
<Badge variant="info">Info</Badge>`}
        props={props}
      />

      <ComponentSection
        title="Fleet usage example"
        description="Use badges inline with vehicle names or preset categories to communicate state at a glance."
        preview={
          <LivePreview className="flex-col items-start gap-4">
            {[
              { name: "Van A · Fleet-001", badge: "Electric", v: "success" as const },
              { name: "Van B · Fleet-002", badge: "Hybrid", v: "warning" as const },
              { name: "Van C · Fleet-003", badge: "Diesel", v: "default" as const },
              { name: "Van D · Fleet-004", badge: "Overdue", v: "danger" as const },
            ].map(({ name, badge, v }) => (
              <div key={name} className="flex items-center gap-3">
                <span className="font-body text-sm text-chargedup-night">{name}</span>
                <Badge variant={v}>{badge}</Badge>
              </div>
            ))}
          </LivePreview>
        }
        code={`<div className="flex items-center gap-3">
  <span>Van A · Fleet-001</span>
  <Badge variant="success">Electric</Badge>
</div>`}
      />

      <ComponentSection
        title="On dark surface"
        preview={
          <DarkPreview className="flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Active</Badge>
            <Badge variant="warning">Pending</Badge>
            <Badge variant="danger">Critical</Badge>
            <Badge variant="info">Info</Badge>
          </DarkPreview>
        }
        code={`// Badges work on Night Blue backgrounds as-is
<Badge variant="success">Active</Badge>`}
      />
    </div>
  );
}
