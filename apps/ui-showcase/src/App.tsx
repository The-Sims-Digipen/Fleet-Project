import { Button, type ButtonVariant } from "@chargedup/ui";

const palette = [
  ["Night Blue", "#020143", "bg-chargedup-night text-chargedup-white"],
  ["Vibrant Gold", "#E8BA44", "bg-chargedup-gold text-chargedup-night"],
  ["White", "#FFFFFF", "bg-chargedup-white text-chargedup-night"],
  ["Light Grey", "#DEDEDE", "bg-chargedup-grey text-chargedup-night"],
  ["Blue", "#004AAD", "bg-chargedup-blue text-chargedup-white"],
  ["Danger", "#B42318", "bg-status-danger text-chargedup-white"],
] as const;

const variants: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];

function ButtonGrid({ dark = false }: { dark?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] border-separate border-spacing-y-3 text-left">
        <thead>
          <tr className={dark ? "text-chargedup-grey" : "text-chargedup-night/65"}>
            <th className="pb-1 font-body text-xs font-normal uppercase tracking-[0.16em]">Variant</th>
            <th className="pb-1 font-body text-xs font-normal uppercase tracking-[0.16em]">Normal</th>
            <th className="pb-1 font-body text-xs font-normal uppercase tracking-[0.16em]">Focused</th>
            <th className="pb-1 font-body text-xs font-normal uppercase tracking-[0.16em]">Disabled</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => (
            <tr key={variant}>
              <th className="pr-5 font-heading text-sm capitalize">{variant}</th>
              <td className="pr-4"><Button variant={variant}>Action</Button></td>
              <td className="pr-4">
                <Button
                  className="ring-2 ring-chargedup-blue ring-offset-2 ring-offset-chargedup-white"
                  variant={variant}
                >
                  Action
                </Button>
              </td>
              <td><Button disabled variant={variant}>Action</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function App() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <header className="mb-12 max-w-3xl">
        <p className="mb-3 font-body text-sm uppercase tracking-[0.2em] text-chargedup-blue">ChargedUp UI</p>
        <h1 className="font-heading text-4xl leading-tight text-chargedup-night sm:text-5xl">Clear components for confident action.</h1>
        <p className="mt-5 max-w-2xl font-body text-lg leading-8 text-chargedup-night/75">
          The source-based foundation for ChargedUp product interfaces, derived from the company BrandBook.
        </p>
      </header>

      <section aria-labelledby="palette-heading" className="mb-12">
        <h2 id="palette-heading" className="mb-5 font-heading text-2xl">Palette</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {palette.map(([name, hex, classes]) => (
            <div className={`min-h-32 rounded-[6px] border border-chargedup-night/10 p-5 ${classes}`} key={name}>
              <p className="font-heading text-base">{name}</p>
              <p className="mt-1 font-body text-sm opacity-75">{hex}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 font-body text-sm text-chargedup-night/65">Danger is a functional UI token, not a BrandBook colour.</p>
      </section>

      <section aria-labelledby="type-heading" className="mb-12 rounded-[6px] bg-chargedup-white p-6 shadow-sm sm:p-8">
        <h2 id="type-heading" className="mb-6 font-heading text-2xl">Typography</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="mb-2 font-body text-xs uppercase tracking-[0.16em] text-chargedup-blue">Montserrat · 700</p>
            <p className="font-heading text-3xl leading-tight">Energy that moves people.</p>
          </div>
          <div>
            <p className="mb-2 font-body text-xs uppercase tracking-[0.16em] text-chargedup-blue">Open Sans · 400</p>
            <p className="font-body text-base leading-7">Practical, readable body copy keeps product guidance clear at every stage of the journey.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="buttons-heading">
        <h2 id="buttons-heading" className="mb-5 font-heading text-2xl">Button states</h2>
        <div className="grid gap-5">
          <article className="min-w-0 rounded-[6px] bg-chargedup-white p-5 shadow-sm sm:p-7">
            <h3 className="mb-4 font-heading text-lg">White surface</h3>
            <ButtonGrid />
          </article>
          <article className="min-w-0 rounded-[6px] bg-chargedup-night p-5 text-chargedup-white shadow-sm sm:p-7">
            <h3 className="mb-4 font-heading text-lg">Night Blue surface</h3>
            <ButtonGrid dark />
          </article>
        </div>
        <p className="mt-4 font-body text-sm text-chargedup-night/65">Use Tab to verify the live Blue focus indicator and Shift+Tab to move backwards.</p>
      </section>
    </main>
  );
}
