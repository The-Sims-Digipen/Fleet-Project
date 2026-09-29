# T01 — Project Persistence & Serialization Library

**Owner:** Chew Shee Yang  
**M1 contract:** Required  
**Supports:** F01, F02, F03, F04

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). T01 persists and validates one complete `ProjectDocument` aggregate, including its embedded Scenarios, and must never persist `SimulationResult` or other derived output.

## Goal

Provide a reusable persistence boundary for saving/loading complete Project aggregates and importing/exporting versioned `.fleetproject` files without coupling UI/domain code directly to IndexedDB.

## Responsibilities

- Maintain the `ProjectRepository` abstraction used by application state.
- Persist the complete Project aggregate atomically as one IndexedDB record.
- Persist the authoritative Project, environment, Preset, analysis, and Scenario data in the Project document.
- Detect stale revisions/conflicting writes where the current repository contract supports them.
- Export the live workspace to a versioned `.fleetproject` file.
- Validate the current document and file formats and assign a fresh Project identity while retaining internal entity identities and references. Earlier prerelease formats are unsupported; incompatible local data is cleared manually instead of being ported.
- Keep derived simulation/analytics results out of authoritative persistence; recompute them from saved inputs.

## M1 boundaries

T01 owns **how the complete Project aggregate is stored and restored**. Project commands own lifecycle and domain invariants; the repository owns revisioned persistence.

## M1 evidence

1. Edit real fleet/scenario data.
2. Save the project.
3. Reload/reopen and verify the same authoritative state is restored.
4. Export/import the workspace and verify a valid independent copy is created.
5. Reject an unsupported/invalid file with an explicit reason.
