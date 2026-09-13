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

## Verification

- Do not claim a change works without validating it.
- Run the most relevant tests after meaningful changes.
- For bugs, reproduce the failure before fixing it when reasonably possible.
- Report what was actually tested.

## Communication

- Be concise.
- State important assumptions.
- Surface significant tradeoffs before making irreversible architectural decisions.

## Project Context

For project planning/source constraints and detailed agent-only implementation context, read `AGENTS/README.md`.

