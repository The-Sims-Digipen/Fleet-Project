import { useState } from "react";
import { SplitPane } from "@chargedup/ui";
import { PageHeading, ImportBanner, SectionHeading } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "children", type: "[ReactNode, ReactNode]", required: true, description: "The two panes. The second pane is the one measured and resized." },
  { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Side-by-side (horizontal) or stacked (vertical) panes." },
  { name: "size", type: "number", description: "Controlled second-pane size as a percentage (0–100)." },
  { name: "defaultSize", type: "number", default: "40", description: "Initial second-pane percentage when uncontrolled." },
  { name: "onSizeChange", type: "(size: number) => void", description: "Called with the new second-pane percentage as the divider moves." },
  { name: "min", type: "number", default: "15", description: "Minimum second-pane percentage." },
  { name: "max", type: "number", default: "85", description: "Maximum second-pane percentage." },
  { name: "step", type: "number", default: "2", description: "Keyboard step in percentage points." },
  { name: "label", type: "string", default: '"Resize panes"', description: "Accessible label for the divider." },
];

const paneBox = "flex h-full items-center justify-center p-4 text-center font-body text-sm text-chargedup-night/70";

function HorizontalDemo() {
  const [size, setSize] = useState(35);
  return (
    <div className="h-56 w-full overflow-hidden rounded-[8px] border border-chargedup-night/10">
      <SplitPane size={size} onSizeChange={setSize} label="Resize sidebar" className="h-full">
        <div className={`${paneBox} bg-chargedup-night/[0.03]`}>Viewport ({Math.round(100 - size)}%)</div>
        <div className={`${paneBox} bg-chargedup-blue/[0.06]`}>Sidebar ({Math.round(size)}%)</div>
      </SplitPane>
    </div>
  );
}

function VerticalDemo() {
  return (
    <div className="h-64 w-full overflow-hidden rounded-[8px] border border-chargedup-night/10">
      <SplitPane orientation="vertical" defaultSize={40} label="Resize panel" className="h-full">
        <div className={`${paneBox} bg-chargedup-night/[0.03]`}>Scene</div>
        <div className={`${paneBox} bg-chargedup-blue/[0.06]`}>Inspector</div>
      </SplitPane>
    </div>
  );
}

export function SplitPanePage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Split Pane"
        description="Two panes separated by a draggable divider. The divider is a keyboard-accessible separator — focus it and use the arrow keys, Home, and End. Sizing is controlled or uncontrolled; the measured value is the second pane's percentage of the container."
      />
      <ImportBanner importStr='import { SplitPane } from "@chargedup/ui";' />

      <SectionHeading>Orientation</SectionHeading>

      <ComponentSection
        title="Horizontal (controlled)"
        description="Drag the divider or focus it and press the arrow keys. This example binds size and onSizeChange to state."
        preview={
          <LivePreview className="flex-col">
            <HorizontalDemo />
          </LivePreview>
        }
        code={`const [size, setSize] = useState(35);

<SplitPane size={size} onSizeChange={setSize} label="Resize sidebar">
  <Viewport />
  <Sidebar />
</SplitPane>`}
        props={props}
      />

      <ComponentSection
        title="Vertical (uncontrolled)"
        description="Stacked panes with an initial size. Leave size out and pass defaultSize to let the component manage it."
        preview={
          <LivePreview className="flex-col">
            <VerticalDemo />
          </LivePreview>
        }
        code={`<SplitPane orientation="vertical" defaultSize={40} label="Resize panel">
  <Scene />
  <Inspector />
</SplitPane>`}
      />
    </div>
  );
}
