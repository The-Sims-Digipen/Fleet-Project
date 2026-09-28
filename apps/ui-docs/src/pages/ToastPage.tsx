import { useState } from "react";
import { Toast, ToastViewport, Button } from "@chargedup/ui";
import { PageHeading, ImportBanner, SectionHeading } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "tone", type: '"info" | "success" | "warning" | "danger"', default: '"info"', description: "Colour, icon, and ARIA politeness. The danger tone announces assertively." },
  { name: "children", type: "ReactNode", required: true, description: "The message content." },
  { name: "onDismiss", type: "() => void", description: "When provided, renders a dismiss button that calls this handler." },
  { name: "dismissLabel", type: "string", default: '"Dismiss"', description: "Accessible label for the dismiss button." },
  { name: "className", type: "string", description: "Extra classes appended to the toast." },
];

const viewportProps: PropsRow[] = [
  { name: "placement", type: '"top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center"', default: '"bottom-right"', description: "Corner or edge the stack is pinned to." },
  { name: "children", type: "ReactNode", required: true, description: "The toasts to stack." },
  { name: "className", type: "string", description: "Extra classes appended to the viewport." },
];

function DismissDemo() {
  const [open, setOpen] = useState(true);
  return open ? (
    <Toast tone="success" onDismiss={() => setOpen(false)}>
      Exported 5 presets.
    </Toast>
  ) : (
    <Button variant="secondary" onClick={() => setOpen(true)}>
      Show toast again
    </Button>
  );
}

export function ToastPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Toast"
        description="A transient status message. The Toast is the presentational surface, carrying the icon, colour, ARIA politeness, and an optional dismiss control. Pair it with ToastViewport to pin a stack to a screen corner, or drop it inline."
      />
      <ImportBanner importStr='import { Toast, ToastViewport } from "@chargedup/ui";' />

      <SectionHeading>Tones</SectionHeading>

      <ComponentSection
        title="All tones"
        preview={
          <LivePreview className="flex-col gap-3">
            <Toast tone="info">Simulation uses the default tariff.</Toast>
            <Toast tone="success">Saved 5 presets to the library.</Toast>
            <Toast tone="warning">Two presets could not be matched.</Toast>
            <Toast tone="danger">Import failed: the file was not valid JSON.</Toast>
          </LivePreview>
        }
        code={`<Toast tone="success">Saved 5 presets to the library.</Toast>
<Toast tone="danger">Import failed: the file was not valid JSON.</Toast>`}
        props={props}
      />

      <SectionHeading>Dismissible</SectionHeading>

      <ComponentSection
        title="With a dismiss control"
        description="Pass onDismiss to render a close button. Auto-dismiss timing and stacking are left to the consumer."
        preview={
          <LivePreview className="flex-col items-start gap-3">
            <DismissDemo />
          </LivePreview>
        }
        code={`const [open, setOpen] = useState(true);

{open && (
  <Toast tone="success" onDismiss={() => setOpen(false)}>
    Exported 5 presets.
  </Toast>
)}`}
      />

      <SectionHeading>Viewport</SectionHeading>

      <ComponentSection
        title="Pinned stack"
        description="ToastViewport pins toasts to a screen corner above modals. Positioning only — the toasts keep their live-region roles."
        preview={
          <LivePreview className="flex-col">
            <div className="relative h-40 w-full overflow-hidden rounded-[8px] border border-chargedup-night/10 bg-chargedup-night/[0.03]">
              {/* Scoped to this box for the demo; in real use the viewport is fixed to the screen. */}
              <div className="pointer-events-none absolute bottom-3 right-3 flex flex-col items-end gap-2">
                <Toast tone="success">First toast</Toast>
                <Toast tone="info">Second toast</Toast>
              </div>
            </div>
          </LivePreview>
        }
        code={`<ToastViewport placement="bottom-right">
  {toasts.map((t) => (
    <Toast key={t.id} tone={t.tone} onDismiss={() => dismiss(t.id)}>
      {t.message}
    </Toast>
  ))}
</ToastViewport>`}
        props={viewportProps}
      />
    </div>
  );
}
