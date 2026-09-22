# T02 — Company Design System & UI Component Library

**Owner:** Dayton Ng Zhi Jie  
**M1 contract:** Required  
**Supports:** F01-F07

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). T02 provides presentation primitives only: shared controls may accept domain values and validation messages, but must not own or duplicate authoritative project, scenario, timeline or simulation state.

## Goal

Implement the company's visual style guide as a reusable React design system with centralized tokens and accessible shared interaction components used across the M1 product screens.

## Foundation package

The initial design-system slice lives in the source-based `@chargedup/ui` workspace package. Its visual source of truth is the [ChargeUp BrandBook](../pdf/ChargeUp%20BrandBook.pdf). Import components and the additive theme stylesheet separately:

```tsx
import { Button } from "@chargedup/ui";
import "@chargedup/ui/theme.css";
```

The stylesheet registers the approved palette, heading/body fonts and package source discovery; it does not reset application elements. Consuming applications remain responsible for importing Tailwind CSS once.

When extending tokens, preserve BrandBook values under the `chargedup-*` namespace. Name non-brand colours by semantic purpose (for example `status-danger`), document why they are needed, and do not present them as BrandBook colours. Prefer extending an existing semantic token over adding a component-specific colour.

This foundation provides tokens, self-hosted fonts, the four-variant Button and a standalone showcase. Dayton remains responsible for the remaining component catalogue and for coordinating later product-screen migrations.

## Responsibilities

- Centralize company-aligned colour, typography, spacing and sizing tokens.
- Provide reusable M1 components such as buttons, inputs, selects, collapsible sections, panels/cards, dialogs, tabs/toolbars and status/warning states.
- Define consistent hover/focus/disabled/error states.
- Ensure keyboard/focus behavior and labels are built into interactive components where applicable.
- Reduce duplicated one-off styling across feature screens.
- Provide a small component showcase/documentation surface so states can be reviewed independently of product screens.

## M1 boundaries

T02 owns reusable presentation primitives and design rules. Product-specific Fleet/Scenario/Analytics behavior remains in the corresponding Fxx/Txx systems.

## M1 evidence

- Change one central token and show the change consistently across multiple M1 screens.
- Demonstrate shared components in at least three product screens.
- Demonstrate keyboard focus, validation/error and disabled/status states without relying on colour alone.
