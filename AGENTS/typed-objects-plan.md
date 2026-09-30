# Typed Project entities and procedural 3D models

Status: implemented foundation. This document records the current direction for later typed-world work.

## Architecture

- The Project document owns physical Depot and Vehicle entities, stable identities, and world transforms. Do not add a parallel persisted scene document or generic scene-object CRUD.
- `ProjectEntityReference` identifies the Depot or Vehicle for runtime selection and editing. Selection is editor state; transform writes use Project commands and the shared Project history.
- `createProjectWorld` projects typed Project entities and effective Scenario state into read-only viewport views. It does not own domain data or expose mutation methods.
- Define procedural model factories under `apps/client/src/models/`. Each factory returns a new, self-contained `THREE.Group` in metres with Y up and its origin at a useful ground contact point.
- Register stable model IDs in `apps/client/src/scene/catalog.ts`. The catalogue maps those IDs to render factories and marks which models can render Vehicle Presets; it does not create scene instances.
- Every factory call owns its hierarchy, geometries, materials, and generated textures. Dispose these resources when the rendered Project entity unmounts. Do not share mutable render resources between calls.
- Rendering style is derived from the Project, active Scenario, and selected year. It is never a separate persisted appearance document or generic appearance-authoring path.
- Keep geometry validation and financial calculations independent of rendering. Procedural rendering failure must not erase or invalidate domain inputs.
- Add future physical types such as chargers, bays, and obstacles as typed Project-domain entities when their product features are scheduled. Do not introduce speculative generic scene authoring.

## Current implementation

- The model catalogue contains `van` and `depot`, backed by factories in `apps/client/src/models/`.
- Production users create and select Vehicles through Fleet Management. Development tools inspect and transform typed Project entities; lighting, camera, selection, and transform-tool settings remain runtime editor state.
- The server persists one complete Project aggregate. There is no separate Scenario table or legacy scene-document API.
- File import, external model URLs, GLB/glTF loading, runtime asset caches, animation, and ECS are outside the chosen architecture.

## Verification expectations

- A model factory returns distinct groups and resources on repeated calls, with finite metre-scale bounds.
- Project world views use stable typed references, authoritative transforms, and the same effective state as simulation.
- Tint updates affect only the rendered instance and do not mutate the Project document.
- Removing an instance disposes only its own geometries, materials, textures, and outline.
- Nested-mesh picking selects the owning Depot or Vehicle; orbiting does not select entities.
- Development gizmo edits, cancellation, and Undo operate through the Project store; production retains Vehicle picking without exposing development Inspector or transform controls.
- Static checks find no separate scene document, generic scene-object mutations, or retired feature stores.
- Run client and server type checks, tests, production builds, and real-browser checks for changes to procedural models or viewport interaction.

Related design: [data contracts](../docs/tech/contracts.md), [depot editor](../docs/tech/depot-editor.md), [architecture](../docs/tech/architecture.md), and [extension guide](../docs/tech/extending-the-editor.md).
