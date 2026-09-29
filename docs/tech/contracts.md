# Data model and persistence contract

A version 5 Project is one physical planning environment and one aggregate persistence record. It owns its Depot, authoritative Vehicle baselines, reusable Vehicle Presets, shared Analysis Settings, active Scenario identity, and ordered Scenarios. Save/load preserves authoritative inputs, not Three.js meshes, editor state, or calculated results.

## Data model

| Entity | Principal data | Relationship / purpose |
|---|---|---|
| Project | ID, name, active Scenario ID, environment, presets, analysis settings | Aggregate and atomic persistence boundary |
| Depot | Stable ID, name, world transform | The Project's physical site |
| Vehicle | Stable ID, baseline preset ID, world transform, operational and holding inputs | One physical fleet unit owned by the Project |
| Vehicle preset | Stable ID, model/type, powertrain, energy, cost, efficiency | Reusable configuration referenced by vehicles and transitions |
| Scenario | Stable ID, name, per-vehicle transition sequences | Alternative plan over the Project baseline |
| Result | Annual counts, cash flows, energy, emissions, feasibility issues | Derived; never authoritative persistence |

In the M1 contract, a Scenario stores Vehicle transition plans only. It does not own a copy of a Vehicle, charging strategy, depot charging share, charger availability, or separate energy tariffs. Later charging and feasibility requirements remain in [F08](../features/F08%20-%20Power%20and%20Feasibility%20Information.md) and [the product specification](../SPECS.md).

Geometry uses XZ ground coordinates in metres and rotations in radians. Scenario duplication deep-copies planning data only. The Project document's `version` field identifies its serialized schema; code uses unversioned domain names because only one schema is authoritative at runtime.

## Project invariants

- Project, depot, vehicle, preset, and Scenario IDs are valid and unique in their scopes.
- The Project fleet is authoritative; rendered vehicles are derived.
- A vehicle's `baselinePresetId` is null or resolves to a Project preset.
- The depot and every vehicle own exactly one valid world transform.
- The default depot supports at most ten fleet vehicles.
- Vehicle creation copies the first unused default world-space spawn transform. Spawn positions are construction inputs; neither a spawn-slot identity nor a parking assignment is persisted.
- Every Scenario plan key resolves to a Project vehicle.
- Every transition target resolves to a Project preset.
- Transition years for a vehicle are unique and ascending.
- Deleting a vehicle removes every Scenario plan keyed by its ID in the same domain command.
- A referenced preset cannot be deleted.
- Every Project contains at least one Scenario, and `activeScenarioId` resolves to one of them.

`normalizeProject` enforces these invariants at construction and every mutation boundary. Repository and portable-file adapters validate untrusted documents through the same function.

`effectivePresetIdFor` is the canonical interpretation of a Vehicle baseline and a Scenario's ordered transitions at a selected year. Simulation and the typed Project world projection consume that same rule; the rendered Vehicle is not another authoritative entity.

## Repository contract

UI/state code depends on `ProjectRepository`, which can:

- list saved Projects;
- load one complete Project record;
- create the aggregate atomically;
- update it atomically with an expected revision.

IndexedDB has one `projects` store keyed by `document.id`. Each record contains the complete Project document plus `revision`, `createdAt`, and `updatedAt`. Persistence metadata is deliberately outside the undoable domain document. A failed transaction exposes no partial save.

Browser storage upgrades from IndexedDB versions 1–4 intentionally discard the pre-release stores and records, then create the aggregate `projects` store; those records are not migrated. Later IndexedDB version upgrades must define an explicit migration instead of repeating this reset. The server's final migration likewise discards unsupported pre-v5 Project records and removes separate Scenario tables. Runtime and import accept only Project document version 5. The portable-file envelope has its own version, independent of the Project document version.

## Portable project file

Format `fleet-transition-planner-project` contains:

- the complete Project document;
- an export timestamp;
- a portable-format version independent of the Project schema version.

Import validates the current format and document, then creates a fresh Project ID. Persistence metadata, camera state, selection, transform controls, lighting, undo history, and derived results are excluded.
