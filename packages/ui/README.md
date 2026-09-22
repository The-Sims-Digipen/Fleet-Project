# @chargedup/ui

Source-based UI primitives for the ChargedUp workspace. The package follows `docs/pdf/ChargeUp BrandBook.pdf` and is internal-only for this first slice.

## Use

Import Tailwind once in the consuming application, then import the additive theme and the component API:

```tsx
import { Button } from "@chargedup/ui";
import "@chargedup/ui/theme.css";

<Button variant="primary">Continue</Button>;
```

`Button` forwards its DOM ref and native button props. It defaults to `variant="primary"` and `type="button"`; set `type="submit"` explicitly inside forms when required.

Run `pnpm dev:ui` from the repository root to review the package on port 5174.

## Token extension rules

- Keep the BrandBook values under the `chargedup-*` token namespace.
- Treat `status-danger` as a functional semantic token, not a brand colour.
- Prefer semantic, reusable tokens over component-specific colours.
- Preserve keyboard focus, disabled behavior, and native element semantics in new components.
- Coordinate new public component APIs with T02 owner Dayton before product migrations.

The remaining component catalogue and migration of existing product screens are intentionally outside this foundation slice.
