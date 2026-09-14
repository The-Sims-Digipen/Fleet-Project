# Global Engineering Preferences

## Decision Making

- Optimize for correctness, maintainability, performance, and simplicity.
- Do not avoid a better architecture merely because it would take a human longer to implement.
- Prefer better architecture even if it requires breaking changes.
- Prefer fixing root causes over adding workarounds.
- Avoid unnecessary abstractions and dependencies.

## Implementation

- Understand the existing architecture before changing it.
- Preserve existing behavior unless a behavior change is explicitly requested.
- Prefer existing project conventions over introducing new ones.

## Web Frontend

- Prefer Tailwind utility classes for component and feature styling.
- Keep `index.css` limited to application-wide CSS: Tailwind imports, global element/root defaults, fonts, shared CSS variables/design tokens, global behaviors, and necessary third-party overrides.
- Do not add component-specific classes to `index.css` when Tailwind utilities can express them cleanly.
- Keep feature styling local so changes to one feature do not unnecessarily affect others.

## Editor Extensions

- Read [`docs/tech/extending-the-editor.md`](docs/tech/extending-the-editor.md) before adding or changing editor UI.
- Implement sidebar tools as isolated feature components composed into the existing `Sidebar` using `CollapsibleSection.tsx`.
- Do not put feature-specific logic directly in `Sidebar.tsx`; `Sidebar` should compose feature panels.
- Reuse existing shared controls and editor conventions where applicable.
- Features that belong in the main workspace/viewport, such as the 3D world, do not need to use `CollapsibleSection`.

## Verification

- Do not claim a change works without validating it.
- Run the most relevant tests after meaningful changes.
- For bugs, reproduce the failure before fixing it when reasonably possible.
- Report what was actually tested.

## Communication

- Be concise.
- State important assumptions.
- Surface significant tradeoffs before making irreversible architectural decisions.

## Project Documentation

Read the documents relevant to the change before implementing it. Do not require team-facing documents to duplicate agent-only context.

### Current scope and planning

- [`docs/SPECS.md`](docs/SPECS.md) — product scope and requirements.
- [`docs/features/README.md`](docs/features/README.md) — current tracked feature catalogue. Read the corresponding `Fxx - Feature Name.md` file before implementing a feature.
- [`docs/weekly-plan.md`](docs/weekly-plan.md) — current implementation schedule and milestone focus.
- [`docs/proposal.md`](docs/proposal.md) — project framing and intended outcome.

### Technical architecture

- [`docs/tech/architecture.md`](docs/tech/architecture.md) — application structure and ownership boundaries; read before architectural changes.
- [`docs/tech/contracts.md`](docs/tech/contracts.md) — shared data/contracts; read before changing cross-system types or persisted data.
- [`docs/tech/extending-the-editor.md`](docs/tech/extending-the-editor.md) — editor/sidebar extension conventions; read before editor UI work.
- [`docs/tech/editing-and-history.md`](docs/tech/editing-and-history.md) — edit lifecycle and history behavior; read before changing editable state or undo/redo.
- [`docs/tech/depot-editor.md`](docs/tech/depot-editor.md) — depot/3D editor behavior; read before depot-world changes.
- [`docs/tech/simulation.md`](docs/tech/simulation.md) — simulation model and calculation guidance; read before simulation work.

### Agent-only context

- [`AGENTS/planning-guidance.md`](AGENTS/planning-guidance.md) — use when changing features, weekly plans, roles, or team-facing planning docs.
- [`AGENTS/source-requirements.md`](AGENTS/source-requirements.md) — use when changing product scope; preserves requirements from the supplied PDF and DOCX briefs.
- [`AGENTS/verification.md`](AGENTS/verification.md) — use when adding acceptance criteria, integration verification, regression coverage, or release checks.
- [`AGENTS/typed-objects-plan.md`](AGENTS/typed-objects-plan.md) — use for typed 3D objects, supplied models, asset handling, and related scene architecture.
