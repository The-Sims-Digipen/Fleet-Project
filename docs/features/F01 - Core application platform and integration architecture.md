# F01 — Core application platform and integration architecture

**Owner:** Shee Yang  
**Active:** M1 W01-W04, then integration changes as required

## What this feature must accomplish

Fleet data can flow through planning → simulation → persistence → 3D without duplicate incompatible models, and the clean repository passes the core automated checks.

## Required behavior

- pnpm workspace/package boundaries and shared TypeScript configuration;
- canonical project/scenario/domain types and versioned serialized document shape;
- shared validation and units conventions at package boundaries;
- client state architecture that separates project-wide state, scenario state, transient editor state, and derived simulation results;
- integration boundaries for simulation, persistence, 3D rendering, and editor geometry;
- deterministic shared fixtures used across client, server, and tests;
- CI execution of typecheck, unit/integration tests, and production builds;
- technical integration fixes needed for the M1 vertical slice.

### Canonical model and package boundaries
- Establish one set of TypeScript domain types used by client, server validation, tests, and serialization. Avoid a separate UI-only copy of fleet/scenario entities.
- Keep editable inputs separate from derived results. Project-wide data, scenario-owned data, transient UI/editor state, request state, and derived calculation state must be distinguishable in the state architecture.
- Stable IDs are the integration key across schedules, bay assignments, selections, 3D instances, issues, and persistence.
- Define version constants for serialized project/model contracts and a single validation entry point at persistence/API boundaries.
- Keep the domain/simulation foundation reusable for a future ChargedUp Nexus module; avoid one-off demo coupling and hard-coded sample-specific behavior.

### Integration path
The M1 path must work end-to-end using the same model: project/sample -> preset/fleet edit -> transition schedule -> simulation -> selected-year projected fleet -> 3D rendering -> save/reopen. Remove adapters that merely copy equivalent shapes unless they enforce a real boundary.

### Shared fixtures and verification
Create deterministic fixtures reusable by domain/simulation/API/UI tests. Keep fixture values synthetic and explicit. Root verification must typecheck/test/build the relevant packages. Technical architecture changes required to integrate later features belong here only when they are truly cross-cutting.

## Related implementation docs

- [Data model and API](../tech/contracts.md)
- [Product design](../design/product-design.md)
