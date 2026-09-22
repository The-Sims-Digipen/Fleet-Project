import { useState } from "react";
import { TextField, NumberField, ColorField, Fieldset } from "@chargedup/ui";
import { PageHeading, ImportBanner, SectionHeading } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const editRow: PropsRow = {
  name: "edit",
  type: "EditLifecycle",
  description: "Optional { beginEdit?, commitEdit?, cancelEdit? } hooks. beginEdit runs on focus/first change, commitEdit on blur or Enter, cancelEdit on Escape — designed to bracket a single undo/history entry.",
};

const textProps: PropsRow[] = [
  { name: "label", type: "string", required: true, description: "Visible label above the input." },
  { name: "value", type: "string", required: true, description: "Committed value (controlled)." },
  { name: "onChange", type: "(value: string) => void", required: true, description: "Called with the new value once it is non-empty." },
  { name: "maxLength", type: "number", default: "100", description: "Maximum length." },
  { name: "helperText", type: "string", description: "Hint shown below the input." },
  { name: "error", type: "string", description: "Error message shown below with role=alert." },
  editRow,
];

const numberProps: PropsRow[] = [
  { name: "label", type: "string", required: true, description: "Visible label above the input." },
  { name: "value", type: "number", required: true, description: "Committed numeric value (controlled)." },
  { name: "onChange", type: "(value: number) => void", required: true, description: "Called with the parsed number once valid." },
  { name: "min", type: "number", description: "Lower bound; values below it are not committed." },
  { name: "max", type: "number", description: "Upper bound; values above it are not committed." },
  { name: "step", type: "number", default: "0.1", description: "Native step increment." },
  editRow,
];

const colorProps: PropsRow[] = [
  { name: "label", type: "string", required: true, description: "Visible label above the control." },
  { name: "value", type: "string", required: true, description: "Committed colour as a #rrggbb hex string." },
  { name: "onChange", type: "(value: string) => void", required: true, description: "Called with the new #rrggbb value once valid." },
  { name: "helperText", type: "string", description: "Hint shown below the control." },
  { name: "error", type: "string", description: "Error message shown below with role=alert." },
  editRow,
];

function FieldsDemo() {
  const [name, setName] = useState("Electric Delivery Van");
  const [battery, setBattery] = useState(75);
  const [accent, setAccent] = useState("#55d6be");
  return (
    <div className="grid w-full max-w-md gap-5">
      <Fieldset title="Preset">
        <TextField label="Preset name" value={name} onChange={setName} />
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Battery (kWh)" value={battery} min={0} step={1} onChange={setBattery} />
          <ColorField label="Accent" value={accent} onChange={setAccent} />
        </div>
      </Fieldset>
    </div>
  );
}

export function FieldsPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Fields"
        description="Labelled inputs with an edit lifecycle. Each field keeps an internal draft while focused, commits on blur or Enter, and runs an optional begin/commit/cancel lifecycle so a consumer can bracket a single undo/history entry. All three work as plain controlled inputs when no lifecycle is passed."
      />
      <ImportBanner importStr='import { TextField, NumberField, ColorField, type EditLifecycle } from "@chargedup/ui";' />

      <SectionHeading>Overview</SectionHeading>

      <ComponentSection
        title="Composed in a Fieldset"
        description="The fields share one visual language with Input and Select. Try typing and pressing Enter or Escape, or picking a colour."
        preview={
          <LivePreview className="flex-col">
            <FieldsDemo />
          </LivePreview>
        }
        code={`const [name, setName] = useState("Electric Delivery Van");

<TextField label="Preset name" value={name} onChange={setName} />
<NumberField label="Battery (kWh)" value={battery} min={0} step={1} onChange={setBattery} />
<ColorField label="Accent" value={accent} onChange={setAccent} />`}
      />

      <SectionHeading>Text field</SectionHeading>

      <ComponentSection
        title="TextField"
        description="Commits the trimmed value on blur or Enter; only non-empty input is committed."
        preview={
          <LivePreview className="flex-col">
            <div className="w-full max-w-sm">
              <TextFieldExample />
            </div>
          </LivePreview>
        }
        code={`<TextField label="Preset name" value={value} onChange={setValue} edit={edit} />`}
        props={textProps}
      />

      <SectionHeading>Number field</SectionHeading>

      <ComponentSection
        title="NumberField"
        description="Keeps a draft so partially typed values are not clobbered, and only commits numbers within min/max."
        preview={
          <LivePreview className="flex-col">
            <div className="w-full max-w-sm">
              <NumberFieldExample />
            </div>
          </LivePreview>
        }
        code={`<NumberField label="Charging power (kW)" value={value} min={0} max={350} step={5} onChange={setValue} />`}
        props={numberProps}
      />

      <SectionHeading>Colour field</SectionHeading>

      <ComponentSection
        title="ColorField"
        description="A native swatch paired with an editable hex input. The swatch commits on pick; the hex input commits when it matches #rrggbb."
        preview={
          <LivePreview className="flex-col">
            <div className="w-full max-w-sm">
              <ColorFieldExample />
            </div>
          </LivePreview>
        }
        code={`<ColorField label="Accent" value={value} onChange={setValue} />`}
        props={colorProps}
      />
    </div>
  );
}

function TextFieldExample() {
  const [value, setValue] = useState("Diesel Delivery Van");
  return <TextField label="Preset name" value={value} onChange={setValue} />;
}

function NumberFieldExample() {
  const [value, setValue] = useState(50);
  return <NumberField label="Charging power (kW)" value={value} min={0} max={350} step={5} onChange={setValue} />;
}

function ColorFieldExample() {
  const [value, setValue] = useState("#004aad");
  return <ColorField label="Accent" value={value} onChange={setValue} helperText="Six-digit hex, e.g. #004AAD." />;
}
