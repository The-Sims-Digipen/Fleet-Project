# F14 — 3D depot authoring tools

**Active:** M4 W01-W04

## What this feature must accomplish

A user can author a complete depot from the viewport and every committed visual edit matches the serialized depot document/history.

## Required behavior

- site/obstacle polygon drawing and vertex editing;
- object creation/select/move/rotate/resize/duplicate/delete interactions for bays and chargers;
- transform gizmos/pointer interactions connected to F13 commands rather than direct mesh mutation;
- grid and rotation snapping with visual feedback;
- finish/cancel behavior for in-progress geometry and transforms;
- invalid-geometry previews/outlines that avoid unsafe triangulation;
- viewport integration with undo/redo, object selection, numeric property edits, and saved scenario switching;
- real-browser interaction tests for editor gestures.

### Viewport authoring
Implement the depot authoring tools using F13 commands: draw site/obstacle, vertex insert/move/delete, add bay/charger, select, translate/rotate/resize, duplicate placement preview, delete, finish/cancel, snapping.

### Mesh/document rule
Pointer manipulation previews/commits document edits; do not make mesh transforms the source of truth. Property-panel edits and viewport gizmos must converge on the same commands/history entries.

### Invalid geometry
Render invalid polygon outlines/vertices without unsafe filled triangulation. Show snapping/invalid feedback during interaction. Escape/pointer cancel restores the transaction baseline.

### Browser verification
Real-browser checks for pointer picking, drag/rotate/resize, polygon creation/edit, cancellation, undo/redo integration, scenario switch, and object/document transform equality.

## Related implementation docs

- [Depot editor](../tech/depot-editor.md)
- [Editing and history](../tech/editing-and-history.md)
- [Architecture](../tech/architecture.md)
- [Extending the 3D editor](../tech/extending-the-editor.md)
