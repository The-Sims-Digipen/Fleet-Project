# Data model and persistence contract

The version 1 Project document represents one physical environment and one aggregate persistence record. It owns its Depot, authoritative Vehicle baselines, reusable Vehicle Presets, shared Analysis Settings, active Scenario identity, and ordered Scenarios. Save/load preserves authoritative inputs. It excludes Three.js meshes, editor state, and calculated results.

## Data model

| Entity | Principal data | Relationship / purpose |
|---|---|---|
| Project | ID, name, active Scenario ID, environment, Presets, Analysis Settings | Aggregate and atomic persistence boundary |
| Depot | Stable ID, name, world transform | Physical site of the Project |
| Vehicle | Stable ID, baseline Preset ID, world transform, operational and holding inputs | One physical fleet unit that the Project owns |
| Vehicle Preset | Stable ID, model/type, powertrain, energy, cost, efficiency | Reusable configuration for Vehicles and transitions |
| Scenario | Stable ID, name, Vehicle transition sequences | Alternative plan over the Project baseline |
| Result | Annual counts, cash flows, energy, emissions | Derived data; never authoritative persistence |

In M1, a Scenario stores Vehicle transition plans only. It does not own a Vehicle copy, charging strategy, Depot charging share, Charger availability, or separate energy tariffs.

Geometry uses XZ ground coordinates in metres and rotations in radians. Scenario duplication makes an independent copy of plan data only. The Project document field `version` is 1 and identifies its serialized format. Code uses unversioned domain names because one current schema is authoritative at runtime.

## Project invariants

- Project, Depot, Vehicle, Preset, and Scenario IDs are valid and unique in their scopes.
- The Project fleet is authoritative. Rendered Vehicles are derived.
- A Vehicle field `baselinePresetId` is null or references a Project Preset.
- The Depot and every Vehicle own exactly one valid world transform.
- The default Depot supports at most ten fleet Vehicles.
- Vehicle creation copies the first unused default spawn transform in world coordinates. Spawn positions are construction inputs. Persistence excludes spawn-slot identities and parking assignments.
- Every Scenario plan key references a Project Vehicle.
- Every transition target references a Project Preset.
- Transition years for a Vehicle are unique and in ascending order.
- A Vehicle deletion command removes every Scenario plan with that Vehicle ID in the same command.
- The system blocks deletion of a referenced Preset.
- Every Project contains at least one Scenario. Its `activeScenarioId` references one of these Scenarios.

`normalizeProject` enforces these invariants at construction and each mutation boundary. Repository and portable-file adapters validate untrusted documents through the same function.

`effectivePresetIdFor` interprets a Vehicle baseline and the ordered Scenario transitions at a selected year. Simulation and the typed Project world projection use this same rule. The rendered Vehicle is not another authoritative entity.

## Repository contract

UI and state code depend on `ProjectRepository`. This interface provides these operations:

- List saved Projects.
- Load one complete Project record.
- Create the aggregate atomically.
- Update the aggregate atomically with an expected revision.

The default browser repository uses IndexedDB. An API adapter also implements the interface. The default browser save path does not use the API adapter.

IndexedDB has one `projects` store with the key `document.id`. Each record contains the complete Project document, `revision`, `createdAt`, and `updatedAt`. Persistence metadata remains outside the domain document and its undo history. A failed transaction exposes no partial save.

The browser database is named `fleet-transition-planner` and uses internal IndexedDB revision 5. This storage revision is independent of Project document format version 1. Initialization creates the current `projects` store. It does not convert or automatically clear incompatible prerelease data. Clear incompatible browser data manually.

The server field `schema_version` matches the Project document version and is 1. The migration runner applies SQL migrations in order. The current clean baseline creates only the aggregate `projects` table. It does not convert incompatible prerelease server data. Recreate the prerelease server database when a breaking persistence change requires a clean start.

## Portable Project file

Format `fleet-transition-planner-project` at version 1 contains:

- The complete Project document.
- An export timestamp.
- The portable format version, independent of the Project document version.

Export includes unsaved document edits. It excludes persistence metadata, camera state, selection, transform controls, lighting, undo history, and derived results.

Import validates the current format and document. It creates a fresh Project ID and stores a new aggregate record. Depot, Vehicle, Preset, and Scenario IDs remain unchanged within the new Project. The active Scenario identity also remains unchanged. Import opens the new Project after a successful save.
