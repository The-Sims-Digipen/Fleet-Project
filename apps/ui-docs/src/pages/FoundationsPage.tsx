import { PageHeading, SectionHeading } from "../components/Headings";

const PALETTE = [
  { name: "Night Blue", hex: "#020143", bg: "#020143", text: "#ffffff", tag: "Primary brand" },
  { name: "Vibrant Gold", hex: "#E8BA44", bg: "#e8ba44", text: "#020143", tag: "Primary accent" },
  { name: "White", hex: "#FFFFFF", bg: "#ffffff", text: "#020143", tag: "Surface" },
  { name: "Light Grey", hex: "#DEDEDE", bg: "#dedede", text: "#020143", tag: "Surface alt" },
  { name: "Blue", hex: "#004AAD", bg: "#004aad", text: "#ffffff", tag: "Interactive" },
  { name: "Danger", hex: "#B42318", bg: "#b42318", text: "#ffffff", tag: "Functional" },
  { name: "Success", hex: "#15803D", bg: "#15803d", text: "#ffffff", tag: "Functional" },
  { name: "Warning", hex: "#B45309", bg: "#b45309", text: "#ffffff", tag: "Functional" },
] as const;

const TYPE_SPECIMENS = [
  {
    name: "Display",
    font: "Montserrat · Bold 700",
    specimen: "Energy that moves people.",
    className: "font-heading text-4xl leading-tight text-chargedup-night",
    token: "--font-heading",
  },
  {
    name: "Body",
    font: "Open Sans · Regular 400",
    specimen: "Practical, readable body copy keeps product guidance clear at every stage of the journey.",
    className: "font-body text-base leading-7 text-chargedup-night",
    token: "--font-body",
  },
  {
    name: "Label / Eyebrow",
    font: "Open Sans · SemiBold — uppercase, tracked",
    specimen: "ChargedUp UI · Components",
    className: "font-body text-xs font-semibold uppercase tracking-[0.2em] text-chargedup-blue",
    token: "eyebrow pattern",
  },
  {
    name: "Caption",
    font: "Open Sans · Regular — muted",
    specimen: "Supplementary help text and metadata appear in this style.",
    className: "font-body text-xs text-chargedup-night/50",
    token: "caption pattern",
  },
] as const;

const RADIUS = [
  { name: "--radius-sm", value: "4px", visual: "rounded", label: "sm" },
  { name: "--radius-md", value: "6px", visual: "rounded-md", label: "md" },
  { name: "--radius-lg", value: "10px", visual: "rounded-xl", label: "lg" },
  { name: "--radius-xl", value: "16px", visual: "rounded-2xl", label: "xl" },
  { name: "--radius-full", value: "9999px", visual: "rounded-full", label: "full" },
] as const;

export function FoundationsPage() {
  return (
    <div className="grid gap-12">
      {/* Palette */}
      <section id="palette">
        <PageHeading
          title="Colour Palette"
          description="Brand and functional colour tokens. All values are available as Tailwind utility classes via the chargedup-* and status-* namespaces."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PALETTE.map(({ name, hex, bg, text, tag }) => (
            <div
              key={name}
              className="overflow-hidden rounded-[10px] border border-chargedup-night/10 shadow-sm"
            >
              <div
                className="flex min-h-[80px] items-end p-4"
                style={{ backgroundColor: bg, color: text }}
              >
                <p className="font-heading text-sm font-bold">{name}</p>
              </div>
              <div className="flex items-center justify-between bg-chargedup-white px-4 py-2.5">
                <span className="font-mono text-xs text-chargedup-night/60">{hex}</span>
                <span
                  className="rounded-full border border-chargedup-night/10 px-2 py-0.5 font-body text-[0.65rem] text-chargedup-night/50"
                >
                  {tag}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 font-body text-xs text-chargedup-night/45">
          Danger, Success, and Warning are functional UI tokens, not BrandBook colours.
        </p>
      </section>

      {/* Typography */}
      <section id="typography">
        <SectionHeading>Typography</SectionHeading>
        <p className="mb-6 font-body text-sm leading-relaxed text-chargedup-night/60">
          Montserrat Bold is the heading face; Open Sans Regular is used for body text. Both are loaded via <code className="rounded bg-chargedup-night/5 px-1 font-mono text-xs">@fontsource</code>.
        </p>
        <div className="grid gap-5">
          {TYPE_SPECIMENS.map(({ name, font, specimen, className, token }) => (
            <div
              key={name}
              className="rounded-[10px] border border-chargedup-night/10 bg-chargedup-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-body text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-chargedup-blue">
                  {font}
                </span>
                <code className="rounded bg-chargedup-night/5 px-1.5 py-0.5 font-mono text-[0.65rem] text-chargedup-night/50">
                  {token}
                </code>
              </div>
              <p className={className}>{specimen}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Spacing & Radius */}
      <section id="spacing">
        <SectionHeading>Spacing & Radius</SectionHeading>
        <p className="mb-6 font-body text-sm leading-relaxed text-chargedup-night/60">
          Border radius tokens define the corner style across all components. The base unit is 6 px (<code className="rounded bg-chargedup-night/5 px-1 font-mono text-xs">--radius-md</code>) — used for buttons, inputs, and cards.
        </p>
        <div className="grid grid-cols-5 gap-4">
          {RADIUS.map(({ name, value, label }) => (
            <div key={name} className="flex flex-col items-center gap-3 text-center">
              <div
                className="h-12 w-full border-2 border-chargedup-blue/40 bg-chargedup-blue/10"
                style={{ borderRadius: value }}
              />
              <div>
                <p className="font-heading text-xs font-bold text-chargedup-night">{label}</p>
                <p className="font-mono text-[0.65rem] text-chargedup-night/45">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
