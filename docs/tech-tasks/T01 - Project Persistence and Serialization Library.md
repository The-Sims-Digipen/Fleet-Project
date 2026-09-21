# T01 — Project Persistence & Serialization Library

**Owner:** Chew Shee Yang  
**M1 contract:** Required  
**Supports:** F01, F02, F03, F04

## Goal

Provide a reusable persistence boundary for saving/loading complete project workspaces and importing/exporting versioned `.fleetproject` snapshots without coupling UI/domain code directly to IndexedDB.

## Responsibilities

- Maintain the `ProjectRepository` abstraction used by application state.
- Persist Project, World and Scenario records atomically in IndexedDB.
- Persist the authoritative project/fleet/settings/scenario documents supplied by T03/T06.
- Detect stale revisions/conflicting writes where the current repository contract supports them.
- Export the live workspace to a versioned `.fleetproject` file.
- Validate imports, support documented schema versions/migrations, and assign fresh local identities to imported copies.
- Keep derived simulation/analytics results out of authoritative persistence; recompute them from saved inputs.

## M1 boundaries

T01 owns **how authoritative workspace state is stored and restored**. T06 owns workspace lifecycle/invariants; T03 owns fleet/scenario domain data.

## M1 evidence

1. Edit real fleet/scenario data.
2. Save the project.
3. Reload/reopen and verify the same authoritative state is restored.
4. Export/import the workspace and verify a valid independent copy is created.
5. Reject an unsupported/invalid file with an explicit reason.
