# F13 — Freeform depot geometry and edit-history engine

**Owner:** Shee Yang  
**Active:** M4 W01-W04

## What this feature must accomplish

Editor tools can rely on one tested geometry/history API and invalid layouts produce structured issues instead of crashes or silent correction.

## Required behavior

- serializable site, obstacle, bay, and charger geometry types in real-world units;
- concave polygon validation, self-intersection/repeated-vertex handling, point/footprint containment, boundary intersection, and object-overlap checks;
- rotated rectangular footprints and consistent bounds shared with the 3D renderer;
- grid/rotation snapping math and numeric transform operations;
- transactional edit actions supporting add/delete/duplicate/move/rotate/resize/vertex edits;
- undo/redo history with one committed gesture per entry, cancellation, redo invalidation, and reference restoration;
- deterministic geometry/history tests for invalid and boundary-contact cases.

### Geometry API
Implement serializable metre-based site/obstacle polygons and rotated rectangle footprints. Provide pure helpers for ring validity, segment intersection, containment, rectangle corners/edges, overlap, snapping, and bounds. Use numeric tolerance consistently.

### Validation order
Validate polygon structural/ring simplicity before triangulation or containment. Concave containment must check full footprint; exact boundary contact is allowed while positive-area overlap is an issue.

### Command/history API
Provide transactional commands for add/delete/duplicate/move/rotate/resize/vertex insert/move/delete and coordinated reference changes. `beginEdit/commitEdit/cancelEdit` groups gestures. New edit after undo clears redo; no-op edits create no entry.

### Tests
Cover bow-tie/repeated/zero-area/near-collinear polygons, concave crossing, edge contact, rotated rectangle overlap, snapping, cancellation, deletion/restoration references, redo invalidation, and one-gesture-one-entry behavior.

## Related implementation docs

- [Depot editor](../tech/depot-editor.md)
- [Editing and history](../tech/editing-and-history.md)
- [Product design](../design/product-design.md)
