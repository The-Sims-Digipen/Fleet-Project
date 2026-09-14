# F15 — Depot editor panels, assignments, and issue workflow

**Active:** M4 W02–M5 W01

## What this feature must accomplish

Every depot property can be inspected/edited without relying exclusively on precise mouse manipulation in the 3D viewport.

## Required behavior

- object tree/list and tool controls;
- numeric X/Z/rotation/dimension/power/installation-year editing with units and validation;
- snapping controls and editor mode state;
- vehicle-to-bay assignment/unassignment and visibility of unassigned/over-capacity conditions;
- geometry issue list with affected-object navigation/selection;
- undo/redo controls and disabled states;
- responsive layout that keeps editor controls reachable even when panels reflow;
- integration tests for property edits, assignments, issue navigation, and history state.

### Editor panels
Provide object tree/list, tool/mode controls, selected-object properties, snapping controls, assignment controls, validation issue list, and undo/redo state. Numeric X/Z/dimensions use metres; rotation can display degrees while domain stores radians.

### Numeric draft lifecycle
Blank/invalid drafts remain local. Enter/blur commits valid input, Escape restores previous value. Width/depth/power and other constrained values must reject invalid commits with associated errors.

### Assignments/issues
Assign/unassign one vehicle per bay; show unassigned/over-capacity conditions. Issue rows identify affected objects and can select/frame them in the viewport. Do not hide issues because an object is off-screen.

### Responsive/accessibility
Controls remain reachable when panels reflow. Pointer-only manipulation always has numeric/list alternatives for core properties. Add integration tests for property edits, assignment conflicts, issue navigation, and history disabled/enabled states.

## Related implementation docs

- [Depot editor](../tech/depot-editor.md)
- [Editing and history](../tech/editing-and-history.md)
- [Product design](../design/product-design.md)
