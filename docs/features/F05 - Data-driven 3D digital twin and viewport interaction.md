# F05 — Data-driven 3D digital twin and viewport interaction

**Owner:** Wei Jun  
**Active:** M1 W02-M3 W04

## What this feature must accomplish

The viewport is a deterministic visualization of the active scenario/year and remains stable through repeated edits and scene switching.

## Required behavior

- rendering of persisted site, obstacle, bay, vehicle, and charger objects from shared document state;
- typed object/renderer registration and reusable model loading rather than object-ID special cases;
- orbit, pan, zoom, reset, raycast selection, highlighting, and list/viewport selection synchronization;
- year-driven vehicle preset/model changes and charger installation visibility;
- power/feasibility visual overlays with text-backed warning state;
- lifecycle/resource handling for loaded models, materials, outlines, event listeners, and scene changes;
- browser tests for picking, camera behavior, year changes, and render-state synchronization.

### Renderer boundary
Consume canonical projected scene/domain data. Meshes are views; do not persist or mutate business state through Three.js object fields. Keep renderer/object kinds typed and registry-driven.

### Interaction
Implement orbit/pan/zoom/reset, picking, highlights, and selection synchronization. Picking child meshes must resolve to the owning domain object. Camera movement must not create edit-history entries.

### Temporal rendering
Vehicle renderer selects the active preset/model for the current analysis year. Plan/Compare only show chargers whose installation year has arrived. Feasibility overlays consume structured issue/result data.

### Resource lifecycle
Share cached immutable asset geometry/textures; clone per-instance hierarchy/materials as needed. Dispose only instance-owned resources. Add browser checks for repeated scene updates/switches and child-mesh picking.

## Related implementation docs

- [Architecture](../tech/architecture.md)
- [Extending the 3D editor](../tech/extending-the-editor.md)
