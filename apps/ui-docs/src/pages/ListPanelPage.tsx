import { useState } from "react";
import {
  Badge,
  Button,
  ListPanel,
  ListPanelToolbar,
  ListPanelBody,
  ListPanelItems,
  ListPanelItem,
  ListPanelFooter,
} from "@chargedup/ui";
import { PageHeading, ImportBanner } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { AppPreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const Diamond = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M6 1l5 5-5 5-5-5 5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const Dot = ({ active }: { active: boolean }) => (
  <span
    className={`size-2 rounded-full ${active ? "bg-chargedup-blue" : "border border-chargedup-night/30"}`}
  />
);

const PRESETS = [
  { id: "1", name: "Diesel Delivery Van", category: "Van" },
  { id: "2", name: "Electric Delivery Van", category: "Van" },
  { id: "3", name: "Hybrid Delivery Van", category: "Van" },
  { id: "4", name: "Diesel Box Truck", category: "Box truck" },
  { id: "5", name: "Electric Box Truck", category: "Box truck" },
];

const WORLDS = [
  { id: "a", name: "Untitled project world", state: "Active" },
  { id: "b", name: "Depot expansion", state: "Saved" },
  { id: "c", name: "2030 target fleet", state: "Unsaved" },
];

const panelProps: PropsRow[] = [
  { name: "children", type: "ReactNode", description: "Toolbar, body, and footer slots." },
  { name: "className", type: "string", description: "Extra classes on the panel frame (border, radius, surface)." },
  { name: "...div props", type: "HTMLDivElement attrs", description: "Native div attributes are forwarded (aria-label, data-*, etc.)." },
];

const toolbarProps: PropsRow[] = [
  { name: "title", type: "ReactNode", description: "Optional leading eyebrow title, pinned left." },
  { name: "trailing", type: "ReactNode", description: "Optional trailing content pinned right (e.g. a count)." },
  { name: "children", type: "ReactNode", description: "Action controls (usually Buttons)." },
];

const bodyProps: PropsRow[] = [
  { name: "empty", type: "boolean", default: "false", description: "Renders the empty state instead of children." },
  { name: "emptyMessage", type: "ReactNode", default: '"Nothing here yet."', description: "Message shown when empty is true." },
  { name: "children", type: "ReactNode", description: "Usually a ListPanelItems list." },
  { name: "className", type: "string", description: "Controls scroll height, e.g. h-44 or max-h-52." },
];

const itemProps: PropsRow[] = [
  { name: "children", type: "ReactNode", required: true, description: "Primary label; truncates when long." },
  { name: "selected", type: "boolean", default: "false", description: "Marks the row current; drives aria-pressed and selected styling." },
  { name: "leading", type: "ReactNode", description: "Decorative leading slot (icon, status dot). aria-hidden." },
  { name: "trailing", type: "ReactNode", description: "Decorative trailing slot (badge, count, marker). aria-hidden." },
  { name: "onSelect", type: "() => void", description: "Selection handler." },
  { name: "disabled", type: "boolean", description: "Disables the row." },
];

const footerProps: PropsRow[] = [
  { name: "status", type: "ReactNode", description: "Left-aligned status text (e.g. \"5 presets\")." },
  { name: "children", type: "ReactNode", description: "Right-aligned actions." },
];

export function ListPanelPage() {
  const [presetId, setPresetId] = useState<string | null>("1");
  const [worldId, setWorldId] = useState<string>("a");
  const [objectSelected, setObjectSelected] = useState(true);

  return (
    <div className="grid gap-10">
      <PageHeading
        title="List Panel"
        description="A composable frame for a toolbar, a scrollable selectable list, and a footer. The pieces are slots, so the same container works for vehicle presets, world/scenario browsers, scene objects, and more — you supply whatever leading and trailing content each row needs."
      />
      <ImportBanner
        importStr={
          'import { ListPanel, ListPanelToolbar, ListPanelBody, ListPanelItems, ListPanelItem, ListPanelFooter } from "@chargedup/ui";'
        }
      />

      {/* Example 1: presets with badge tags + footer actions */}
      <ComponentSection
        title="Toolbar, list, and footer"
        description="Rows carry a leading icon and a trailing Badge tag. The toolbar holds actions plus a count; the footer pairs status text with actions."
        preview={
          <AppPreview>
            <div className="max-w-[420px]">
              <ListPanel>
                <ListPanelToolbar trailing={PRESETS.length}>
                  <Button variant="ghost" className="min-h-8 px-2.5 text-xs">New</Button>
                  <Button variant="ghost" className="min-h-8 px-2.5 text-xs">Save</Button>
                  <Button variant="ghost" className="min-h-8 px-2.5 text-xs" disabled={!presetId}>Duplicate</Button>
                  <Button variant="ghost" className="min-h-8 px-2.5 text-xs" disabled={!presetId}>Delete</Button>
                </ListPanelToolbar>
                <ListPanelBody className="h-44">
                  <ListPanelItems label="Vehicle presets">
                    {PRESETS.map((p) => (
                      <ListPanelItem
                        key={p.id}
                        leading={<Diamond />}
                        trailing={<Badge>{p.category}</Badge>}
                        selected={p.id === presetId}
                        onSelect={() => setPresetId(p.id)}
                      >
                        {p.name}
                      </ListPanelItem>
                    ))}
                  </ListPanelItems>
                </ListPanelBody>
                <ListPanelFooter status={`${PRESETS.length} presets`}>
                  <Button variant="ghost" className="min-h-8 px-2.5 text-xs">Import</Button>
                  <Button variant="ghost" className="min-h-8 px-2.5 text-xs">Export</Button>
                </ListPanelFooter>
              </ListPanel>
            </div>
          </AppPreview>
        }
        code={`<ListPanel>
  <ListPanelToolbar trailing={presets.length}>
    <Button variant="ghost">New</Button>
    <Button variant="ghost">Save</Button>
    <Button variant="ghost" disabled={!selectedId}>Duplicate</Button>
    <Button variant="ghost" disabled={!selectedId}>Delete</Button>
  </ListPanelToolbar>

  <ListPanelBody className="h-44">
    <ListPanelItems label="Vehicle presets">
      {presets.map((p) => (
        <ListPanelItem
          key={p.id}
          leading={<DiamondIcon />}
          trailing={<Badge>{p.category}</Badge>}
          selected={p.id === selectedId}
          onSelect={() => select(p.id)}
        >
          {p.name}
        </ListPanelItem>
      ))}
    </ListPanelItems>
  </ListPanelBody>

  <ListPanelFooter status={\`\${presets.length} presets\`}>
    <Button variant="ghost">Import</Button>
    <Button variant="ghost">Export</Button>
  </ListPanelFooter>
</ListPanel>`}
        props={panelProps}
      />

      {/* Example 2: titled toolbar + status dots + ACTIVE marker */}
      <ComponentSection
        title="Titled toolbar with status rows"
        description="A title in the toolbar, a leading status dot, and a trailing text marker. Selecting a row makes it active."
        preview={
          <AppPreview>
            <div className="max-w-[420px]">
              <ListPanel>
                <ListPanelToolbar title="Worlds">
                  <Button variant="ghost" className="min-h-8 px-2.5 text-xs">New</Button>
                  <Button variant="ghost" className="min-h-8 px-2.5 text-xs">Duplicate</Button>
                  <Button variant="ghost" className="min-h-8 px-2.5 text-xs" disabled={WORLDS.length <= 1}>Remove</Button>
                </ListPanelToolbar>
                <ListPanelBody className="max-h-40">
                  <ListPanelItems label="Worlds">
                    {WORLDS.map((w) => {
                      const active = w.id === worldId;
                      return (
                        <ListPanelItem
                          key={w.id}
                          leading={<Dot active={active} />}
                          trailing={
                            <span
                              className={`font-body text-[10px] font-bold uppercase tracking-wider ${active ? "text-chargedup-blue" : "text-chargedup-night/45"}`}
                            >
                              {active ? "Active" : w.state}
                            </span>
                          }
                          selected={active}
                          onSelect={() => setWorldId(w.id)}
                        >
                          {w.name}
                        </ListPanelItem>
                      );
                    })}
                  </ListPanelItems>
                </ListPanelBody>
              </ListPanel>
            </div>
          </AppPreview>
        }
        code={`<ListPanel>
  <ListPanelToolbar title="Worlds">
    <Button variant="ghost">New</Button>
    <Button variant="ghost">Duplicate</Button>
    <Button variant="ghost" disabled={worlds.length <= 1}>Remove</Button>
  </ListPanelToolbar>

  <ListPanelBody className="max-h-40">
    <ListPanelItems label="Worlds">
      {worlds.map((w) => {
        const active = w.id === worldId;
        return (
          <ListPanelItem
            key={w.id}
            leading={<StatusDot active={active} />}
            trailing={<StateMarker>{active ? "Active" : w.state}</StateMarker>}
            selected={active}
            onSelect={() => setWorldId(w.id)}
          >
            {w.name}
          </ListPanelItem>
        );
      })}
    </ListPanelItems>
  </ListPanelBody>
</ListPanel>`}
        props={toolbarProps}
      />

      {/* Example 3: single item, footer link, empty state note */}
      <ComponentSection
        title="Footer link and empty state"
        description="The footer's right slot can hold a text-style action. Toggle the row to see the empty state, which ListPanelBody renders for you."
        preview={
          <AppPreview>
            <div className="max-w-[420px]">
              <ListPanel>
                <ListPanelToolbar trailing={objectSelected ? 1 : 0}>
                  <Button variant="ghost" className="min-h-8 px-2.5 text-xs" onClick={() => setObjectSelected(true)}>Add Object</Button>
                  <Button variant="ghost" className="min-h-8 px-2.5 text-xs" disabled={!objectSelected} onClick={() => setObjectSelected(false)}>Delete Object</Button>
                </ListPanelToolbar>
                <ListPanelBody className="h-32" empty={!objectSelected} emptyMessage="No objects in the world. Click Add Object to get started.">
                  <ListPanelItems label="Scene objects">
                    <ListPanelItem leading={<Diamond />} trailing={1} selected>
                      Low-poly Van
                    </ListPanelItem>
                  </ListPanelItems>
                </ListPanelBody>
                <ListPanelFooter status={`${objectSelected ? 1 : 0} object`}>
                  <Button
                    variant="ghost"
                    className="min-h-8 px-2.5 text-xs"
                    disabled={!objectSelected}
                    onClick={() => setObjectSelected(false)}
                  >
                    Clear selection
                  </Button>
                </ListPanelFooter>
              </ListPanel>
            </div>
          </AppPreview>
        }
        code={`<ListPanelBody
  className="h-32"
  empty={objects.length === 0}
  emptyMessage="No objects in the world. Click Add Object to get started."
>
  <ListPanelItems label="Scene objects">
    {objects.map((o) => (
      <ListPanelItem key={o.id} leading={<Icon />} trailing={o.count} selected={o.id === selectedId}>
        {o.name}
      </ListPanelItem>
    ))}
  </ListPanelItems>
</ListPanelBody>`}
        props={bodyProps}
      />

      {/* Item + footer prop reference (no preview needed beyond above) */}
      <ComponentSection
        title="Item and footer props"
        description="ListPanelItem renders as an accessible <li><button> and exposes selection via aria-pressed. Leading and trailing slots are decorative (aria-hidden), so the row's accessible name stays the label text."
        preview={
          <AppPreview>
            <div className="max-w-[420px]">
              <ListPanel>
                <ListPanelBody>
                  <ListPanelItems label="Sample rows">
                    <ListPanelItem leading={<Diamond />} trailing={<Badge variant="info">New</Badge>} selected>
                      Selected row
                    </ListPanelItem>
                    <ListPanelItem leading={<Diamond />}>Default row</ListPanelItem>
                    <ListPanelItem leading={<Diamond />} disabled>
                      Disabled row
                    </ListPanelItem>
                  </ListPanelItems>
                </ListPanelBody>
                <ListPanelFooter status="3 rows" />
              </ListPanel>
            </div>
          </AppPreview>
        }
        code={`<ListPanelItem leading={<Icon />} trailing={<Badge>New</Badge>} selected>
  Selected row
</ListPanelItem>
<ListPanelItem leading={<Icon />}>Default row</ListPanelItem>
<ListPanelItem leading={<Icon />} disabled>Disabled row</ListPanelItem>`}
        props={[...itemProps, ...footerProps]}
      />
    </div>
  );
}
