# F10 — Scenario comparison and decision analytics

**Owner:** Dayton  
**Active:** M3 W01-W04

## What this feature must accomplish

Duplicating a plan and changing one strategy produces an immediate, trustworthy comparison with no cross-scenario mutation.

## Required behavior

- two-scenario selection with safe behavior when fewer than two scenarios exist;
- synchronized analysis-year control with independent scenario data and camera state;
- side-by-side metrics for cost, payback, energy, emissions, transition counts, charging, and feasibility;
- absolute/relative deltas with undefined/non-comparable states handled explicitly;
- annual/cumulative comparison charts and roadmap data;
- independent scenario editing followed by immediate recomputation of only the affected result path;
- integration with dual 3D scenes supplied by F05/F12;
- responsive comparison layout and browser/UI tests for scenario isolation.

### Comparison UI/data
Build comparison from two scenario IDs plus shared project inputs. Keep left/right result objects and scene states keyed to their scenario identity; never alias mutable scenario data.

### Required presentation
Implement side-by-side KPIs, B-minus-A deltas, annual/cumulative charts, transition roadmap, charging/feasibility summaries, suitability context, selected-year metrics, and integration slots for the dual 3D scenes.

### Null/meaning rules
Payback may be not reached; relative delta may be undefined; zero-distance/zero-baseline metrics may be null. Render these states explicitly. Label delta direction and units. If only one scenario exists, offer duplication.

### Tests
Duplicate/edit one scenario and verify the other result/document remains byte/logically unchanged; verify shared-year behavior and responsive identity of both sides.

## Related implementation docs

- [Product design](../../design/product-design.md)
