# Engineering documentation

- [Final application feature inventory and M1–M6 roadmap](features.md)
- [Weekly task table, assigned owners, deadlines, and blockers](weekly-plan.md)
- [Product definition and requirements](proposal.md) — working scope with source provenance and acceptance requirements.
- [Detailed product specification](SPECS.md)
- [Architecture and technology stack](tech/architecture.md) — implemented foundations and planned components.
- [Domain models, API contracts, and persistence](tech/contracts.md)
- [Calculation rules, suitability, and worked fixtures](tech/simulation.md)
- [Product design](design/product-design.md) and [UI/UX artifacts](design/ui-ux/README.md)
- [Freeform depot editor behavior](tech/depot-editor.md)
- [Acceptance tests and all-feature traceability](tech/verification.md)
- [Deliverables, ownership, and milestone gates](deliverables.md)

`apps/client` contains the browser app and `apps/server` the API. Tests live alongside their source. No mobile/desktop application or CI/CD workflow exists yet; additional directories will be introduced when needed.

- [Editing and history](tech/editing-and-history.md)
- [Adding a module or object type](tech/extending-the-editor.md)
