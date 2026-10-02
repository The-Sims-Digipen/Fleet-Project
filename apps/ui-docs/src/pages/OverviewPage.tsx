import { Badge } from "@chargedup/ui";
import themeCss from "@chargedup/ui/theme.css?raw";
import { PageHeading, SectionHeading } from "../components/Headings";
import { CodeBlock } from "../components/CodeBlock";
import { NAV_GROUPS } from "../components/NavSidebar";

// Derive the component count from the documented catalogue so it is always updated when more components added.
const COMPONENT_COUNT = NAV_GROUPS.find((group) => group.title === "Components")?.items.length ?? 0;
const THEME_BLOCK = themeCss.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const TOKEN_COUNT = new Set(THEME_BLOCK.match(/--[\w-]+(?=\s*:)/g) ?? []).size;

// When the UI library/docs last changed, injected from git at build time.
const LAST_UPDATED = __LAST_UPDATED__;

function formatLastUpdated(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const INSTALL_CODE = `# Install the UI package (it lives in the workspace)
pnpm add @chargedup/ui

# In your app's CSS entry point:
@import "@chargedup/ui/theme.css";`;

const USAGE_CODE = `import { Button, Badge, Card } from "@chargedup/ui";
import "@chargedup/ui/theme.css";

export function Example() {
  return (
    <Card>
      <Badge variant="success">Active</Badge>
      <Button variant="primary">Get started</Button>
    </Card>
  );
}`;

export function OverviewPage() {
  return (
    <div>
      <PageHeading
        title="ChargedUp UI"
        description="A React component library derived from the ChargeUp BrandBook. Built on Tailwind CSS v4, TypeScript, and React 19. Developer-only, source-based — no separate build step required."
        badge={<Badge variant="info">v0.1.0</Badge>}
      />

      {/* Hero stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Components", value: String(COMPONENT_COUNT) },
          { label: "Design tokens", value: String(TOKEN_COUNT) },
          { label: "Last updated", value: formatLastUpdated(LAST_UPDATED) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-[10px] border border-chargedup-night/10 bg-chargedup-white p-5 shadow-sm"
          >
            <p className="font-heading text-3xl font-bold text-chargedup-blue">{value}</p>
            <p className="mt-1 font-body text-sm text-chargedup-night/60">{label}</p>
          </div>
        ))}
      </div>

      <SectionHeading>Installation</SectionHeading>
      <p className="mb-4 font-body text-sm leading-relaxed text-chargedup-night/65">
        The package is an internal workspace package — no npm publish required. Import the theme CSS once at your app's entry point.
      </p>
      <CodeBlock code={INSTALL_CODE} language="sh" />

      <div className="mt-8">
        <SectionHeading>Quick start</SectionHeading>
        <CodeBlock code={USAGE_CODE} />
      </div>

      <div className="mt-10 rounded-[10px] border border-chargedup-gold/30 bg-chargedup-gold/8 p-5">
        <p className="font-heading text-sm font-bold text-chargedup-night">
          Brand Tokens
        </p>
        <p className="mt-1 font-body text-sm leading-relaxed text-chargedup-night/70">
          All tokens follow the <code className="rounded px-1 font-mono text-xs bg-chargedup-night/5">chargedup-*</code> namespace. Semantic tokens like{" "}
          <code className="rounded px-1 font-mono text-xs bg-chargedup-night/5">status-danger</code> are functional and not BrandBook colours. See the{" "}
          <a href="#palette" className="text-chargedup-blue underline underline-offset-2">Foundations</a> section for the full palette.
        </p>
      </div>
    </div>
  );
}
