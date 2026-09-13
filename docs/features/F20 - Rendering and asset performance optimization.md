# F20 — Rendering and asset performance optimization

**Owner:** Wei Jun  
**Active:** M5 W01-M6 W02

## What this feature must accomplish

The recorded 3D workload meets the project performance target without sacrificing editor correctness or scenario isolation.

## Required behavior

- scene/object update profiling during timeline scrubbing, selection, editor transforms, and scenario switching;
- geometry/material/model reuse and disposal fixes;
- render-loop invalidation/update improvements where appropriate;
- picking/highlight/editor interaction optimization for the reference object counts;
- repeated scene/project switch checks for retained resources/listeners;
- coordination with F06 asset optimization where mesh/material complexity is the bottleneck;
- browser measurements against the reference performance workload.

### Measure first
Profile production/optimized builds using the standard reference workload. Record browser/hardware, object/vehicle counts, single vs dual scene, and operations measured.

### Optimize ownership/lifecycle
Investigate model clone/material count, geometry/textures reuse, outlines/highlights, render-loop invalidation, R3F subscriptions, picking, editor preview transforms, and repeated scene switching. Fix retained listeners/resources before micro-optimizing geometry.

### Asset coordination
When mesh/material/texture complexity is the bottleneck, coordinate changes with F06 while preserving catalog IDs, physical dimensions, and visual distinguishability.

### Regression
After optimization, rerun picking/editor/year/dual-scene correctness tests and compare measured latency/frame/resource behavior. Do not trade away correctness or scenario isolation.

## Related implementation docs

- [Architecture](../tech/architecture.md)
- [Extending the 3D editor](../tech/extending-the-editor.md)
- [Product design](../design/product-design.md)
