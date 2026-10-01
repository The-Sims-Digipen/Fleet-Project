# F08 — Power & Feasibility Information

**Catalogue priority:** SHOULD

**Primary owner:** Dayton Ng Zhi Jie

## Current panel

The Charging & feasibility panel displays an informational note.
Its description is “Later product scope.”
The note identifies charging strategies, Charger placement and site-power feasibility as absent from the M1 simulation.

The panel performs no demand, capacity or feasibility calculation.
It does not display mock values as calculated results.
It is excluded from the completed M1 feature scope.

## Integration

`PowerFeasibility` contains the note inside a shared `CollapsibleSection`.
It does not read or change Project data.
It introduces no charging model, persistence fields or calculation engine.

## Demonstration

1. Open the Charging & feasibility panel.
2. Read its informational note.
