# Typed objects and procedural 3D models

Status: implemented foundation. This document records the current direction for later typed-object work.

## Architecture

- Use typed domain objects and shared data structures without ECS. Add vehicle, charger, bay, and obstacle types alongside their actual product features.
- Keep serializable scene objects separate from rendering. Documents store stable object and definition IDs, transforms, appearance overrides, and future domain data; they never store Three.js instances or factory functions.
- Define procedural model factories under `apps/client/src/models/`. Each factory returns a new, self-contained `THREE.Group` in metres with Y up and its origin at a useful ground contact point.
- Register factories in `apps/client/src/scene/catalog.ts`. The viewport renders document objects through the typed registry, so another generic model requires a factory and catalog entry rather than viewport changes.
- Every factory call owns its hierarchy, geometries, materials, and generated textures. Dispose these resources when its scene instance unmounts. Do not share mutable render resources between instances.
- Keep appearance overrides isolated per object. Selection decoration must not alter model materials.
- A procedural model is presentation, not domain identity. Vehicle, charger, bay, and obstacle data remain authoritative even if their visuals change.
- Keep geometry validation and financial calculations independent of rendering. Procedural rendering failure must not erase or invalidate domain inputs.

## Current implementation

- The initial catalog definition is `van`, backed by `createVanModel()` in `apps/client/src/models/van.ts`.
- World Objects provides compact list selection and modal creation. Create/delete/reset and appearance changes integrate with snapshot undo history.
- File import, external model URLs, GLB/glTF loading, runtime asset caches, animation, and ECS are outside the chosen architecture.

## Verification expectations

- A factory returns distinct groups and resources on repeated calls, with finite metre-scale bounds.
- Multiple instances keep transforms and appearance independent.
- Removing an instance disposes only its own geometries, materials, textures, and outline.
- Nested-mesh picking selects the owning document object; orbiting does not select objects.
- Unknown catalog IDs are rejected for creation, and structurally representable unknown document entries remain deletable from editor UI.
- Run client type checks, tests, production build, and real-browser checks for new procedural models.

Related design: [data contracts](../docs/tech/contracts.md), [depot editor](../docs/tech/depot-editor.md), [architecture](../docs/tech/architecture.md), and [extension guide](../docs/tech/extending-the-editor.md).
