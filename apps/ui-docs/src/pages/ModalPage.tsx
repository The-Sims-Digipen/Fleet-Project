import { useState } from "react";
import { Button, Modal, Input, Select } from "@chargedup/ui";
import { PageHeading, ImportBanner } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "title", type: "string", required: true, description: "Modal heading, also used as the accessible name." },
  { name: "description", type: "string", description: "Optional subtitle rendered below the title." },
  { name: "onDismiss", type: "() => void", required: true, description: "Called when Escape is pressed or backdrop is clicked." },
  { name: "children", type: "ReactNode", required: true, description: "Modal body content." },
  { name: "maxWidth", type: "string", default: '"max-w-md"', description: "Tailwind max-width class. Override for wider or narrower modals." },
];

function BasicModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      {open && (
        <Modal title="New Project" description="Create a fresh project or reuse an existing world." onDismiss={() => setOpen(false)}>
          <div className="grid gap-4">
            <Input label="Project name" placeholder="Untitled project" autoFocus />
            <Select label="3D world">
              <option value="new">Create a new world</option>
              <option value="existing">Reuse: Depot Alpha</option>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setOpen(false)}>Create Project</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function DangerModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>Delete scenario</Button>
      {open && (
        <Modal title="Remove Scenario" description='Remove "Plan B" from this project? This cannot be undone.' onDismiss={() => setOpen(false)}>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => setOpen(false)}>Remove Scenario</Button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function ModalPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Modal"
        description="Uses the native <dialog> element for correct focus trapping, Escape handling, and backdrop. Mount/unmount to show/hide — the component calls showModal() on mount automatically."
      />
      <ImportBanner importStr='import { Modal, type ModalProps } from "@chargedup/ui";' />

      <ComponentSection
        title="Form modal"
        description="Trigger with state. Mount the Modal conditionally — it calls showModal() on mount."
        preview={<LivePreview><BasicModalDemo /></LivePreview>}
        code={`const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Open modal</Button>

{open && (
  <Modal
    title="New Project"
    description="Create a fresh project or reuse an existing world."
    onDismiss={() => setOpen(false)}
  >
    <Input label="Project name" placeholder="Untitled project" />
    <div className="flex justify-end gap-2">
      <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="primary" onClick={() => setOpen(false)}>Create</Button>
    </div>
  </Modal>
)}`}
        props={props}
      />

      <ComponentSection
        title="Danger / confirmation modal"
        preview={<LivePreview><DangerModalDemo /></LivePreview>}
        code={`{open && (
  <Modal title="Remove Scenario" onDismiss={() => setOpen(false)}>
    <div className="flex justify-end gap-2">
      <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="danger" onClick={() => setOpen(false)}>Remove</Button>
    </div>
  </Modal>
)}`}
      />
    </div>
  );
}
