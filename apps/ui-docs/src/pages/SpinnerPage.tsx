import { Spinner } from "@chargedup/ui";
import { PageHeading, ImportBanner } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview, DarkPreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Size of the spinner." },
  { name: "color", type: '"gold" | "night" | "blue" | "white"', default: '"night"', description: "Spinner colour using brand tokens." },
  { name: "label", type: "string", default: '"Loading…"', description: "Screen-reader accessible label (role=status, aria-label)." },
];

export function SpinnerPage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Spinner"
        description="Animated loading indicator. CSS border-based — zero JS animation overhead. Respects prefers-reduced-motion."
      />
      <ImportBanner importStr='import { Spinner, type SpinnerSize, type SpinnerColor } from "@chargedup/ui";' />

      <ComponentSection
        title="Sizes"
        preview={
          <LivePreview className="gap-6 items-center">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </LivePreview>
        }
        code={`<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />`}
        props={props}
      />

      <ComponentSection
        title="Colours (light surface)"
        preview={
          <LivePreview className="gap-6 items-center">
            <Spinner color="night" />
            <Spinner color="blue" />
            <Spinner color="gold" />
          </LivePreview>
        }
        code={`<Spinner color="night" />
<Spinner color="blue" />
<Spinner color="gold" />`}
      />

      <ComponentSection
        title="White on dark surface"
        preview={
          <DarkPreview className="gap-6 items-center">
            <Spinner color="white" size="sm" />
            <Spinner color="white" size="md" />
            <Spinner color="white" size="lg" />
          </DarkPreview>
        }
        code={`<Spinner color="white" size="lg" />`}
      />

      <ComponentSection
        title="Inside a button"
        preview={
          <LivePreview className="gap-3">
            <button
              type="button"
              disabled
              className="inline-flex min-h-11 items-center gap-2.5 rounded-[6px] border-transparent bg-chargedup-gold px-4 py-2 font-heading text-sm font-bold text-chargedup-night opacity-70"
            >
              <Spinner size="sm" color="night" />
              Saving…
            </button>
          </LivePreview>
        }
        code={`<Button variant="primary" disabled>
  <Spinner size="sm" color="night" />
  Saving…
</Button>`}
      />
    </div>
  );
}
