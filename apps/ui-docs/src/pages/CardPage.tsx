import {
  Card,
  Badge,
  Button,
  Input,
  ListPanel,
  ListPanelToolbar,
  ListPanelBody,
  ListPanelItems,
  ListPanelItem,
  ListPanelFooter,
} from "@chargedup/ui";
import { PageHeading, ImportBanner, SectionHeading } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { AppPreview, ThemedPreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "variant", type: '"default" | "flat" | "dark"', default: '"default"', description: "Surface style. default has a drop shadow, flat has no shadow, dark uses Night Blue background." },
  { name: "header", type: "ReactNode", description: "Content rendered in a header section above the body, separated by a divider." },
  { name: "footer", type: "ReactNode", description: "Content rendered in a footer section below the body, separated by a divider." },
  { name: "children", type: "ReactNode", required: true, description: "Card body content." },
  { name: "className", type: "string", description: "Extra classes added to the card root." },
];

export function CardPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Card"
        description="Surface container with BrandBook border radius and optional shadow. Supports header and footer slots with automatic dividers."
      />
      <ImportBanner importStr='import { Card, type CardVariant } from "@chargedup/ui";' />

      <ComponentSection
        title="Variants"
        preview={
          <AppPreview className="grid gap-4">
            <Card>
              <p className="font-body text-sm text-chargedup-night/70">Default card — drop shadow + white surface.</p>
            </Card>
            <Card variant="flat">
              <p className="font-body text-sm text-chargedup-night/70">Flat card — border only, no shadow.</p>
            </Card>
            <Card variant="dark">
              <p className="font-body text-sm text-chargedup-white/70">Dark card — Night Blue surface.</p>
            </Card>
          </AppPreview>
        }
        code={`<Card>Default card content.</Card>
<Card variant="flat">Flat card content.</Card>
<Card variant="dark">Dark card content.</Card>`}
        props={props}
      />

      <ComponentSection
        title="With header and footer"
        preview={
          <AppPreview>
            <Card
              header={
                <div className="flex items-center justify-between">
                  <p className="font-heading text-sm font-bold text-chargedup-night">Fleet Summary</p>
                  <Badge variant="success">Active</Badge>
                </div>
              }
              footer={
                <div className="flex justify-end gap-2">
                  <Button variant="ghost">Cancel</Button>
                  <Button variant="primary">Save Plan</Button>
                </div>
              }
            >
              <p className="font-body text-sm text-chargedup-night/70">
                12 vehicles · 4 transitioning in 2026 · 8 remaining on diesel.
              </p>
            </Card>
          </AppPreview>
        }
        code={`<Card
  header={
    <div className="flex items-center justify-between">
      <p className="font-heading text-sm font-bold">Fleet Summary</p>
      <Badge variant="success">Active</Badge>
    </div>
  }
  footer={
    <div className="flex justify-end gap-2">
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Save Plan</Button>
    </div>
  }
>
  12 vehicles · 4 transitioning in 2026.
</Card>`}
      />

      <SectionHeading>Dark mode (preview)</SectionHeading>

      <ComponentSection
        title="Theme-aware components"
        description="A proof-of-concept of the semantic-token theming. Toggle the surface below: Card, Button, Input, and ListPanel use the library's surface/ink/accent tokens, so a single `.dark` class on an ancestor flips them. Components not yet migrated still use the fixed light palette."
        preview={
          <ThemedPreview className="flex-col gap-4">
            <div className="grid w-full gap-4">
              <Card
                header={<p className="font-heading text-sm font-bold text-ink">Fleet Summary</p>}
                footer={
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost">Cancel</Button>
                    <Button variant="secondary">Save</Button>
                    <Button variant="primary">Confirm</Button>
                  </div>
                }
              >
                <div className="grid gap-4">
                  <p className="font-body text-sm text-ink/70">
                    12 vehicles · 4 transitioning in 2026 · 8 remaining on diesel.
                  </p>
                  <Input label="Plan name" defaultValue="2026 Transition" />
                </div>
              </Card>

              <ListPanel>
                <ListPanelToolbar title="Worlds" trailing={<span>3</span>}>
                  <Button size="toolbar" variant="ghost">New</Button>
                </ListPanelToolbar>
                <ListPanelBody>
                  <ListPanelItems label="Worlds">
                    <ListPanelItem selected leading={<span>◇</span>} trailing={<Badge variant="info">active</Badge>}>
                      Depot Alpha
                    </ListPanelItem>
                    <ListPanelItem leading={<span>◇</span>}>Depot Bravo</ListPanelItem>
                    <ListPanelItem leading={<span>◇</span>}>Depot Charlie</ListPanelItem>
                  </ListPanelItems>
                </ListPanelBody>
                <ListPanelFooter status="3 worlds">
                  <Button size="toolbar" variant="ghost">Import</Button>
                </ListPanelFooter>
              </ListPanel>
            </div>
          </ThemedPreview>
        }
        code={`// Wrap any subtree in an element carrying the \`dark\` class:
<div className="dark">
  <Card>…</Card>
  <Input label="Plan name" />
  <ListPanel>…</ListPanel>
</div>

// The components reference semantic tokens (bg-surface, text-ink/70,
// border-ink/10, text-accent) that .dark overrides in theme.css.`}
      />
    </div>
  );
}
