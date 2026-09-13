# F18 — Responsive, accessible, and failure-resilient application UI

**Owner:** Dayton  
**Active:** M5 W01-M6 W02

## What this feature must accomplish

All primary workflows remain usable across supported viewport sizes and common input/error states without hidden controls or destructive recovery behavior.

## Required behavior

- responsive workspace/depot/compare layouts with no inaccessible clipped primary panels;
- keyboard operation, focus visibility, field labels, error association, and non-color-only status feedback;
- consistent empty/loading/error/invalid-draft/stale-save states;
- destructive-action confirmations and preservation of in-memory edits after backend failure;
- large-table/list interaction behavior for the reference fleet;
- automated DOM/integration coverage for critical states and browser verification of responsive interaction.

### UI hardening scope
Apply these requirements to Home, Plan, Depot, and Compare: responsive reachability, keyboard/focus semantics, labels/units/errors, empty/loading/error/invalid states, destructive confirmations, non-color-only warnings, and a clear simulation/indicative-results label in the application shell/results context.

### Failure recovery
Save/backend failure retains all edits and dirty status; stale revision has explicit recovery; unknown version returns safely to project list; geometrically invalid documents remain editable; no exception boundary should blank the entire app for a recoverable domain issue.

### Responsive requirements
At >=1280px use the intended multi-panel desktop layouts. Below that, reflow/drawer/scroll where necessary without hiding a plan identity or primary action. Depot precision editing is desktop-first, but its controls must still remain reachable on supported sizes.

### Tests
Use Testing Library for keyboard/forms/status/destructive flows and real-browser checks for responsive panel access, WebGL/editor interaction, and end-to-end recovery states.

## Related implementation docs

- [Data model and API](../tech/contracts.md)
- [Depot editor](../tech/depot-editor.md)
- [Editing and history](../tech/editing-and-history.md)
- [Product design](../design/product-design.md)
