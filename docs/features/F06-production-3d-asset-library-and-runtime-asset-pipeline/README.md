# F06 — Production 3D asset library and runtime asset pipeline

**Owner:** Jarrel  
**Active:** M1 W01-M5 W03

## What this feature must accomplish

Assets can be swapped by preset/object definition without renderer changes and the reference depot remains within the rendering budget.

## Required behavior

- vehicle variants suitable for user-defined presets, parking bays, chargers, obstacles, and other required depot visuals;
- consistent origin, forward axis, metre scale, dimensions, and footprint/bounds metadata;
- GLB/runtime preparation compatible with the typed catalog and reusable loading cache;
- recognizable visual variation without encoding business logic into the mesh assets;
- polygon/bounding dimensions that agree with editor collision footprints;
- runtime optimization of representative assets after scene profiling;
- source/license metadata stored with the repository assets where required for use.

### Asset deliverables
Provide production-ready GLB assets for required vehicle/preset visual categories, chargers, parking/depot objects, and obstacles needed by current product flows. Assets must work through the typed catalog without renderer code changes.

### Conventions
Use metre scale/Y-up when possible; document corrective transform otherwise. Set useful origin/base, forward axis, physical dimensions, and footprint/bounds that agree with editor collision dimensions. Keep mesh naming/art separate from business identifiers.

### Runtime constraints
Prefer self-contained static GLB assets compatible with the current loader. Avoid unnecessary texture/mesh/material complexity. Optimize only after profiling representative single/dual-scene workload. Store required source/license attribution metadata in the repository.

## Related implementation docs

- [Architecture](../../tech/architecture.md)
- [Extending the 3D editor](../../tech/extending-the-editor.md)
- [Product design](../../design/product-design.md)
