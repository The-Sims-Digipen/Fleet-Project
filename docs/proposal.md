# Fleet Transition Planner — product definition

## Problem, audience, and outcome

Fleet operators must choose which vehicles to electrify, when to replace them, and how to provide charging without exceeding depot space or power. The product helps a non-technical fleet decision maker compare those choices through visible assumptions, understandable results, and an interactive representation of the depot.

Success means a user can create or load a sample fleet, author a depot, schedule transitions, compare two alternatives against the same no-transition/current-fleet baseline, explain their financial/emissions differences, recognize infeasible plans, and save/reopen the work. The result is indicative decision support, not an engineering certification or operational control system.

## Committed product

A single-user browser application runs locally with browser-local IndexedDB project persistence and a Fastify API available for later backend features. It includes fleet editing, staged transition scheduling, depot/external/mixed charging, a custom calculation engine, a flat freeform depot editor, scenario-driven 3D visualization, suitability explanations, charts, and two-plan comparison. No account or public hosting is required.

Synthetic sample data provides an immediate demonstration. Fleet size and vehicle type are not restricted to the 100-van example. Sample values are explicitly illustrative. Use realistic synthetic or historical data unless ChargedUp explicitly approves other data.

## Requirements and acceptance scenarios

| Requirement | Required outcome |
|---|---|
| R01 — Persistent workspace | Create/open a project, create/rename/duplicate reusable worlds, and create/rename/duplicate/delete/save/reopen independent scenarios; failed or stale saves preserve the working copy and last valid stored state. |
| R02 — Fleet and generic transition planning | Build user-defined vehicle presets and a heterogeneous fleet; filter/group/select vehicles; assign any target preset and transition year; produce correct annual fleet composition. |
| R03 — Calculations | Recalculate TCO, CAPEX, OPEX, payback, energy, and emissions from explicit editable assumptions with deterministic annual/cumulative breakdowns. |
| R04 — Charging and feasibility | Model depot/external/mixed charging, charger inventory/timing, connection capacity, dwell/readiness, and depot-space constraints. |
| R05 — Depot authoring | Build an irregular flat depot with obstacles, bays, and chargers; edit with snapping/numeric properties, assignments, validation, cancel, undo/redo, and shared-world persistence with separate world-bound scenario data. |
| R06 — 3D digital twin | Inspect the data-driven depot, selected-year vehicle/charger state, constraint overlays, and independent comparison scenes with full viewport interaction. |
| R07 — Explainable choices | Rank transition candidates using operational/economic/feasibility factors and show factor-level reasons and assumption impacts without automatic schedule mutation. |
| R08 — Comparison and analytics | Compare two independent plans at the same analysis year using synchronized metrics, charts, roadmaps, feasibility, and 3D state. |
| R09 — Technical quality | Keep primary panels reachable responsively, handle invalid/error states safely, meet performance targets, and support reproducible clean builds/browser-storage setup. |

The application must support these end-to-end scenarios using generic preset transitions:

1. transition Vehicle A now and B next year to selected target presets, then reverse or delay their order; verify cost, payback, emissions, annual preset composition, 3D state, and the saved schedule.
2. compare selected vehicles or a category transitioning in stages with a full transition plan; unscheduled vehicles remain on their current presets.
3. keep the vehicle schedule fixed and compare depot, external, and mixed charging; infrastructure, operating cost, and result differences reflect the strategy.
4. change fuel/electricity prices by ±20% or edit target-preset economics; recalculate and explain the changed economics without silently altering the schedule.
5. change charger quantities/years; update costs, visibility, space/operational feedback, and red/text overload warnings.


## Boundaries

No multi-user accounts, public service hosting, native mobile/desktop clients, live telemetry, charger control, route optimization, citywide energy model, or production ChargedUp Nexus integration is included. The flat editor excludes terrain, CAD/GIS import, site holes, and cable routing. Detailed tax/subsidy/finance models and engineering-grade electrical simulation are excluded. CSV/PDF export is not promised.

Advanced sensitivity sweeps and regional presets are outside M1–M6 scope. Manual assumption edits and explanations are included.

## Delivery

M1: 4 October 2026, 23:59; M2: 8 November 2026, 23:59; M3: 30 November 2026. Times are Singapore time. M4-M6 use four relative working weeks each; calendar dates are not set.
