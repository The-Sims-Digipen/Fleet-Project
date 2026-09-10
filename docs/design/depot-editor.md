# Freeform depot editor specification

Owners: Tan Wei Jun (viewport), Chew Shee Yang (geometry/history), Dayton Ng Zhi Jie (panels), Jarrel Tay Wee Han (assets), Yap Zhi Kai (bay assignments). Covers DE-01–DE-07, FL-05, VI-01/02, and CH-07. See [contracts](../contracts.md) for the persisted shapes.

## Geometry and coordinate conventions

Use a flat XZ plane in metres with Y-up rendering. Site/obstacle polygons contain at least three vertices, no holes, and an implicit closing edge. Store counterclockwise rings after valid creation; do not reverse or repair invalid authored rings silently. Coordinates remain full precision; input display defaults to two decimal metres. Rectangle footprints use centre, positive width/depth, and Y-axis rotation in radians. Convert degrees at the UI boundary.

Grid snapping defaults to 0.25 m and rotation snapping to 15 degrees, each toggleable. Numeric inputs allow unsnapped values. Do not round the persisted scene on every render. Geometry epsilon is 1e-6 m for point/boundary distance checks; use a consistent scaled tolerance for orientation/cross-product predicates and test near-collinear cases. The validator is a pure module with no Three.js dependency.

## Tools and interactions

| Tool | Interaction | Commit/cancel and constraints |
|---|---|---|
| Select | Click object or object-list row; highlight its footprint and properties | Empty ground click clears selection; selection does not change history |
| Draw site | Click vertices on ground; preview closing edge | Enter/Finish closes after at least three vertices; Escape cancels. Replacing an existing boundary lists affected placements. |
| Edit vertices | Select vertex; drag or edit X/Z numerically; insert on edge or delete vertex | One gesture = one undo step; cannot delete below three vertices; invalid finished geometry is flagged |
| Draw obstacle | Same polygon tools, stored as an obstacle | Reuse vertex editing; outside/overlapping shapes remain visible as issues |
| Add bay/charger | Preview footprint then click/place or enter coordinates | Commit adds one object; charger configuration includes installation year/power/costs |
| Move/rotate/resize | Transform handles and numeric alternatives | Width/depth stay positive; charger footprint changes do not silently change its electrical rating |
| Duplicate | Deep-copy object/configuration with a new object ID | Start a placement preview offset by one grid step; cancel removes the preview |
| Delete | Confirm for an object with references; otherwise a discrete undoable edit | Deleting a bay clears only its assignments in this scenario after confirmation |
| Assign vehicle | Choose bay from selected vehicle or assign via bay panel | One vehicle per bay and one bay per vehicle; reject a second occupant until explicitly reassigned |
| Undo/redo | Toolbar and Ctrl/Cmd+Z / redo shortcuts | Restore complete document transaction and reference changes, excluding camera/year/save status |

Enter commits a valid numeric draft; Escape restores its previous value. Pointer cancellation restores the transaction baseline. Finish pending edits before selection, scenario switching, or save; ask the user to resolve invalid numeric drafts instead of dropping them. A new edit after undo discards redo. Loading a project resets history; switching scenarios does not mix unrelated partial gestures.

## Validation and issue policy

Validate ring simplicity (including nonadjacent edge intersections, zero-length edges, repeated vertices, and zero area) before containment/triangulation. Concave site containment must consider full object edges/area, not just object centres or rectangle corners. A footprint whose edge exits a concave boundary is outside even if all corners lie inside.

Boundary contact is allowed within epsilon. Positive-area overlaps between bays, chargers, or obstacle footprints are infeasible; exact edge contact is allowed and does not imply a real-world clearance guarantee. Bays/chargers/obstacles must lie within the site. Obstacles must not overlap one another. No parking aisle, turning radius, accessibility clearance, or cable reach engineering is inferred.

| Code | Display / downstream behavior |
|---|---|
| INVALID_SITE_RING | Draw the authored outline/vertices without triangulation; suspend containment checks and mark site feasibility unavailable |
| INVALID_OBSTACLE_RING | Draw its outline only; flag the obstacle and mark overall layout infeasible |
| OBJECT_OUTSIDE_SITE | Highlight object and boundary crossing; preserve its input coordinates |
| FOOTPRINT_OVERLAP | Highlight both object IDs and name the conflict |
| UNASSIGNED_VEHICLE | Show vehicle in the unassigned list; do not place it in a fabricated bay |

Geometry-invalid but structurally representable documents can be saved so users can return to repair them. Finite coordinates/minimum vertex counts still apply. Invalid layouts never become a “feasible” result, but planned numeric costs/charger inventory remain available with the warning described in [simulation](../simulation.md). Do not remove an overlapping charger from CAPEX or silently recalculate it as nonexistent.

## Rendering and persistence

Mesh bounds/footprints agree with persisted metre dimensions. Use visible ICE/EV distinctions plus legends, not color alone. In edit mode, future chargers are ghosts with their installation year. In Plan/Compare, only installed chargers render. Bays, boundary, and obstacles are static across years within one scenario; they vary between scenario layouts rather than acquiring an unrequested construction timeline.

Each scenario saves its own layout and assignments. Duplicate scenario deep-copies the layout, preserving internal references within the new namespace. Save inputs only, not meshes or undo stacks. Comparison views read independent snapshots and must not share mutable geometry objects.

Required checks include concave boundaries, bow-tie polygons, repeated/collinear vertices, edge contact, containment crossing, rotated rectangles, overlap pairs, assignment removal, and undo/redo across deletion. See [verification](../verification.md) for acceptance IDs and deadlines.
