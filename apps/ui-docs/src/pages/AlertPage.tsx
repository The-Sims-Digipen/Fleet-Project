import { Alert } from "@chargedup/ui";
import { PageHeading, ImportBanner, SectionHeading } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "variant", type: '"info" | "success" | "warning" | "danger"', default: '"info"', description: "Semantic colour and icon." },
  { name: "title", type: "string", description: "Optional bold heading inside the alert." },
  { name: "children", type: "ReactNode", required: true, description: "Alert body content." },
  { name: "onDismiss", type: "() => void", description: "If provided, renders an ✕ close button." },
];

export function AlertPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Alert"
        description='Inline contextual message. Uses role="alert" to ensure screen readers announce content changes immediately.'
      />
      <ImportBanner importStr='import { Alert, type AlertVariant } from "@chargedup/ui";' />

      <SectionHeading>Variants</SectionHeading>

      <ComponentSection
        title="All variants"
        preview={
          <LivePreview className="flex-col items-stretch gap-3">
            <Alert variant="info">Charger installation is scheduled for Q2 2026. Plan accordingly.</Alert>
            <Alert variant="success">Transition plan saved successfully.</Alert>
            <Alert variant="warning">Site power demand will exceed the connection limit in 2027.</Alert>
            <Alert variant="danger">Vehicle Fleet-007 failed the suitability check.</Alert>
          </LivePreview>
        }
        code={`<Alert variant="info">Charger installation is scheduled for Q2 2026.</Alert>
<Alert variant="success">Transition plan saved successfully.</Alert>
<Alert variant="warning">Site power demand will exceed the connection limit in 2027.</Alert>
<Alert variant="danger">Vehicle Fleet-007 failed the suitability check.</Alert>`}
        props={props}
      />

      <ComponentSection
        title="With title"
        preview={
          <LivePreview className="flex-col items-stretch gap-3">
            <Alert variant="warning" title="Power limit exceeded">
              The depot's 300 kW connection limit will be exceeded in transition year 2028. Consider staggered charger installation or a load management system.
            </Alert>
            <Alert variant="danger" title="Unsaved changes">
              You have unsaved edits. Leaving this page will discard your transition plan.
            </Alert>
          </LivePreview>
        }
        code={`<Alert variant="warning" title="Power limit exceeded">
  The depot's 300 kW connection limit will be exceeded in 2028.
</Alert>`}
      />

      <ComponentSection
        title="Dismissible"
        description="Pass onDismiss to show a close button. Manage visibility in parent state."
        preview={
          <LivePreview className="flex-col items-stretch">
            <Alert variant="info" title="Welcome to ChargedUp" onDismiss={() => alert("dismissed")}>
              Start by creating a new project or opening an existing one.
            </Alert>
          </LivePreview>
        }
        code={`const [visible, setVisible] = useState(true);

{visible && (
  <Alert variant="info" title="Welcome" onDismiss={() => setVisible(false)}>
    Start by creating a project.
  </Alert>
)}`}
      />
    </div>
  );
}
