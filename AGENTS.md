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

## Verification

- Do not claim a change works without validating it.
- Run the most relevant tests after meaningful changes.
- For bugs, reproduce the failure before fixing it when reasonably possible.
- Report what was actually tested.

## Communication

- Be concise.
- State important assumptions.
- Surface significant tradeoffs before making irreversible architectural decisions.
