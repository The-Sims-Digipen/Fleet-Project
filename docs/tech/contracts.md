# Data model and persistence contract

A Project is one physical planning environment. It owns its depot, authoritative fleet, reusable vehicle presets, shared assumptions, and Scenarios. Save/load preserves authoritative inputs, not Three.js meshes, editor state, or calculated results.

## Data model

| Entity | Principal data | Relationship / purpose |
|---|---|---|
| Project | ID, name, active Scenario ID, environment, presets, analysis settings | Aggregate and atomic persistence boundary |
| Depot | Stable ID, name, world transform | The Project's physical site |
| Vehicle | Stable ID, baseline preset ID, world transform, operational and holding inputs | One physical fleet unit owned by the Project |
| Vehicle preset | Stable ID, model/type, powertrain, energy, cost, efficiency | Reusable configuration referenced by vehicles and transitions |
| Scenario | Stable ID, name, per-vehicle transition sequences | Alternative plan over the Project baseline |
| Result | Annual counts, cash flows, energy, emissions, feasibility issues | Derived; never authoritative persistence |

Geometry uses XZ ground coordinates in metres and rotations in radians. Scenario duplication deep-copies planning data only. The Project document's `version` field identifies its serialized schema; code uses unversioned domain names because only one schema is authoritative at runtime.

## Project invariants

- Project, depot, vehicle, preset, and Scenario IDs are valid and unique in their scopes.
- The Project fleet is authoritative; rendered vehicles are derived.
- A vehicle's `baselinePresetId` is null or resolves to a Project preset.
- The depot and every vehicle own exactly one valid world transform.
- The default depot supports at most ten fleet vehicles.
- Every Scenario plan key resolves to a Project vehicle.
- Every transition target resolves to a Project preset.
- Transition years for a vehicle are unique and ascending.
- Deleting a vehicle removes every Scenario plan keyed by its ID in the same domain command.
- A referenced preset cannot be deleted.
- Every Project contains at least one Scenario, and `activeScenarioId` resolves to one of them.

`normalizeProject` enforces these invariants at construction and every mutation boundary. Repository and portable-file adapters validate untrusted documents through the same function.

## Repository contract

UI/state code depends on `ProjectRepository`, which can:

- list saved Projects;
- load one complete Project record;
- create the aggregate atomically;
- update it atomically with an expected revision.

IndexedDB has one `projects` store keyed by `document.id`. Each record contains the complete Project document plus `revision`, `createdAt`, and `updatedAt`. Persistence metadata is deliberately outside the undoable domain document. A failed transaction exposes no partial save.

## Portable project file

Format `fleet-transition-planner-project` contains:

- the complete Project document;
- an export timestamp;
- a portable-format version independent of the Project schema version.

Import validates the current format and document, then creates a fresh Project ID. Persistence metadata, camera state, selection, transform controls, lighting, undo history, and derived results are excluded.
