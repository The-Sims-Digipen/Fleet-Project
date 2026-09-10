# Final application features — M1 to M6

This is the working feature inventory for the completed Fleet Transition Planner, based on [SPECS.md](SPECS.md) and the team's decisions: a browser application, single-user local demonstration, saved scenarios, side-by-side comparisons, and a freeform depot editor. Features below are planned unless explicitly described as existing. They are not a claim of sponsor approval or completed implementation.

The final product is targeted for **M6**, not M3. The milestone allocation below is a proposed delivery sequence; M4–M6 dates have not been decided. It supersedes the three-milestone completion assumption in the initial deliverables document.

## What the final app will be like

A fleet operator opens a sample project or creates a fleet, lays out a depot, and chooses which vehicles to electrify in each year. They configure charging and economic assumptions, then move through the timeline to see the depot change. The app shows cost, emissions, suitability, and space/power constraints immediately. The operator duplicates a plan, changes its strategy, compares both plans side by side, and saves their work to reopen later.

The main experience comprises a fleet list, an interactive 3D depot, a properties/assumptions panel, a year timeline, financial/emissions results, and a comparison view. It is a decision-support simulation, not an operational fleet-control system.

## 1. Project and scenario management

- **SC-01 — Start a project:** create a fleet or open realistic synthetic sample data, with an initial depot and assumptions suitable for demonstrating the product.
- **SC-02 — Manage scenarios:** create, name, duplicate, and delete plans so users can explore alternatives without overwriting the original.
- **SC-03 — Save and reopen:** persist fleet inputs, scenario assumptions, transition schedules, depot layouts, and charger installation years in the local application's database.
- **SC-04 — Reliable editing:** show unsaved changes, save success/failure, and loading states; confirm destructive deletion and preserve edits when a save fails.

No login or account management is planned. Persistence serves one local user/workspace and is not a private multi-user service.

## 2. Fleet and vehicle management

- **FL-01 — Fleet list:** view, add, edit, and remove vehicles; represent individual vehicles and select them as groups/categories. Fleet size and vehicle type are not fixed to the illustrative 100-van example.
- **FL-02 — Operational attributes:** edit vehicle ID/type, age, annual mileage, daily distance, fuel use, route/duty cycle, depot-return pattern, available dwell time, utilisation, and planned replacement year.
- **FL-03 — Selection and grouping:** select one vehicle, arbitrary combinations, or categories such as type, age, or route suitability; filter/sort the list to find candidates.
- **FL-04 — ICE and EV assumptions:** configure relevant purchase/lease, efficiency, range, maintenance, and residual-value assumptions for the vehicles being compared.
- **FL-05 — Depot assignment:** assign vehicles to bays and clearly identify unassigned vehicles or insufficient parking capacity.

## 3. Transition planning

- **TR-01 — Assign transition years:** schedule individual vehicles or selected groups and revise or clear their schedules.
- **TR-02 — Partial and staged adoption:** support arbitrary staged plans, rapid electrification, and gradual replacement. Vehicles not scheduled to transition remain ICE.
- **TR-03 — Annual roadmap:** show the number and types of vehicles transitioning each year, with cumulative EV/ICE counts.
- **TR-04 — Year navigation:** select or scrub through an analysis year; update the depot, installed chargers, fleet state, and selected-year results from actual scenario data.

## 4. Freeform depot editor

- **DE-01 — Site boundary:** draw and edit an irregular, flat site polygon rather than restricting users to a fixed rectangle.
- **DE-02 — Obstacles:** create and edit polygon footprints for buildings or other areas unavailable for bays and chargers.
- **DE-03 — Layout objects:** add, select, move, rotate, duplicate, resize where applicable, and delete parking bays and chargers.
- **DE-04 — Precise placement:** provide visible dimensions, numeric property editing, grid snapping, and consistent real-world units.
- **DE-05 — Geometry feedback:** identify self-intersecting/invalid boundaries, objects outside the site, and overlaps with other objects or obstacles. Show affected objects and understandable reasons.
- **DE-06 — Edit recovery:** support undo/redo for layout changes and cancellation of an in-progress edit.
- **DE-07 — Scenario layouts:** retain each plan's depot configuration when saving, duplicating, and comparing scenarios.

The agreed editor is a flat freeform site/layout editor. CAD import, terrain sculpting, site polygons with holes, and detailed cable routing are not included.

## 5. Interactive 3D visualization

- **VI-01 — Depot scene:** display the site, bays, obstacles, vehicles, and chargers using consistent scale and recognizable assets.
- **VI-02 — Camera and selection:** orbit, pan, zoom, select objects, and inspect their properties; connect viewport and list selection.
- **VI-03 — Scenario-driven changes:** show ICE vehicles becoming EVs and chargers appearing in their installation years, with readable visual distinctions.
- **VI-04 — Feasibility overlay:** highlight affected locations and show site demand against the connection limit. Turn the site red on overload and include text feedback so color is not the only signal.
- **VI-05 — Comparison scenes:** show each plan's depot state at the same selected year alongside its results.

The current plane/cube editor provides selection, property editing, camera interaction, and undo/redo foundations. It does not yet implement the depot features above.

## 6. Charging strategy and feasibility

- **CH-01 — Strategy selection:** configure depot charging, external network charging, or a mixture with an editable split.
- **CH-02 — Charger configuration:** set charger type/power, quantity, cost, location, and installation year.
- **CH-03 — Charging prices:** edit depot electricity prices, external charging tariffs, and installation costs.
- **CH-04 — Energy requirements:** estimate fleet electricity needs and depot/external charging allocation for each year.
- **CH-05 — Power constraints:** compare indicative depot demand with a fixed site connection limit; flag overloads rather than silently treating them as feasible.
- **CH-06 — Operational constraints:** flag insufficient charging availability or dwell time using the documented assumptions, including vehicles scheduled before required chargers are installed.
- **CH-07 — Space constraints:** expose inadequate room for the planned bays/chargers and connect layout conflicts to feasibility feedback.

These are indicative planning checks, not an electrical engineering certification or detailed charging-session simulation.

## 7. Financial simulation

- **FI-01 — Editable assumptions:** expose analysis period, ownership assumptions, purchase/lease costs, residual values, fuel/electricity prices, consumption, maintenance, and charging infrastructure costs.
- **FI-02 — ICE baseline:** compare the transition plan against retaining an ICE fleet under explicit replacement/ownership assumptions.
- **FI-03 — Cost results:** calculate whole-fleet TCO, transition CAPEX, annual operating costs, and differences against the baseline.
- **FI-04 — Cost breakdown:** show vehicle and infrastructure contributions, depot/external charging costs, per-vehicle cost, and cost per kilometre where meaningful.
- **FI-05 — Payback:** show cumulative costs and indicative breakeven, including a clear “not reached within the analysis period” result.
- **FI-06 — Immediate recalculation:** update results when vehicle schedules, charging choices, installation timing, or assumptions change.

## 8. Energy and emissions

- **EM-01 — Energy totals:** estimate fuel displaced and electricity consumed by year and over the analysis period.
- **EM-02 — Emissions comparison:** calculate ICE and transition-plan emissions and their absolute/percentage differences using visible editable factors.
- **EM-03 — Explain boundaries:** label included emissions sources and units so users understand what the estimate covers.

## 9. Suitability and explanations

- **SU-01 — Transition ranking:** rank candidate vehicles using daily distance versus EV range, route predictability, depot return, charging access, dwell time, replacement timing, utilisation, and economics.
- **SU-02 — Explain recommendations:** show the favorable factors and constraints behind a vehicle's ranking. Rankings inform the user's choice rather than automatically committing a transition plan.
- **SU-03 — Assumption impact:** explain which changed inputs drive cost/emissions differences; support manual what-if changes such as fuel/electricity prices increasing or decreasing by 20%.

## 10. Side-by-side comparison and results

- **CO-01 — Choose two plans:** compare alternatives using an explicit common fleet baseline and analysis period.
- **CO-02 — Compare outcomes:** display TCO, CAPEX, operating costs, payback, energy, emissions, yearly transition counts, and feasibility warnings side by side.
- **CO-03 — Readable charts:** present annual and cumulative trends, breakdowns, and a transition roadmap with labels, units, and useful explanations.
- **CO-04 — Inspect the same year:** coordinate year selection across both plans so differences in vehicles, chargers, and demand are understandable.

## 11. Usability and final-release quality

- **QU-01 — Accessible controls:** labeled inputs, keyboard operation for forms and editor commands, visible focus, readable contrast, and textual alternatives to color-only warnings.
- **QU-02 — Safe input handling:** understandable invalid/empty states; prevent invalid inputs from producing misleading financial results.
- **QU-03 — Transparent simulation:** keep assumptions, units, synthetic-data provenance, and the indicative nature of results visible.
- **QU-04 — Responsive interaction:** verify repeated edits, year navigation, and dual-scene comparison against a documented representative fleet/layout workload.
- **QU-05 — Verified results:** independent worked calculation examples plus automated scenario, geometry, persistence, and integration checks; real-browser visual verification.
- **QU-06 — Reproducible local app:** documented install/run/build workflow for the required Windows 11, macOS Tahoe, and Ubuntu 24.04 targets, with Ubuntu server testing. Record actual evidence rather than assuming support.
- **QU-07 — Team delivery:** CI checks, PR review, versioned migrations, documented asset provenance, a demonstration dataset, and a final walkthrough/handover.

## Proposed M1–M6 delivery sequence

Each milestone builds on the previous one. Features introduced early continue to be refined and tested through M6. This is sequencing for discussion, not a claim that features are already complete.

| Milestone | Date (Singapore time) | Demonstrable outcome |
|---|---|---|
| M1 | 4 October 2026, 23:59 | Working vertical slice: sample fleet, editable transition year, basic ICE-versus-EV cost calculation, simple depot reflecting the selected year, and initial automated checks. |
| M2 | 8 November 2026, 23:59 | Usable planning workflow: editable fleet and assumptions, individual/group schedules, annual roadmap, scenario creation/duplication and save/load, financial and emissions results. |
| M3 | 30 November 2026; cutoff time unspecified | Integrated charging and comparison: depot/external/mixed strategies, charger timing/costs, indicative power feedback, two-plan results and depot comparison, initial suitability explanations. |
| M4 | Date not decided | Complete freeform authoring: site polygons, obstacles, bay/charger editing, snapping, vehicle assignments, undo/redo, boundary/overlap validation, and persisted scenario layouts. |
| M5 | Date not decided | Complete the remaining inventory and integrate it: charging/dwell/space constraints, ranking and assumption explanations, consistent comparison behavior, finished assets, and usability/performance improvements. |
| M6 | Date not decided | Final acceptance and handover: all committed features demonstrated, calculation/geometry/persistence tests passing, platform evidence recorded, final usability fixes, reproducible demo and documentation. |

Freeform editor design and technical investigation should begin before M4; M4 is its complete integration target, not its start date. Infrastructure, testing, and CI begin at M1 and continue throughout.

## Optional extensions — not committed for M6

- Automated sensitivity sweeps, uncertainty ranges, and advanced sensitivity charts.
- Regional assumption presets beyond the editable core inputs.

The existing specification identifies these as optional. Do not count them as promised features without a separate scope decision.

## Outside the agreed final scope

- Multi-user accounts, team permissions, live collaboration, and publicly hosted service operation.
- Native mobile/desktop apps; the deliverable is a browser application for local demonstration.
- Route optimisation, citywide energy simulation, live telemetry, and real charging-network control/integration.
- Exhaustive tax, subsidy, financing, battery-degradation, or engineering-grade power-flow models.
- CAD/GIS import, terrain modelling, detailed cable routing, and automatic depot-layout optimisation.
- Production integration into ChargedUp Nexus; keep the calculation foundation reusable, but an actual integration is a separate project.

CSV imports, report/PDF exports, and live data feeds have not been requested and are not included in the committed inventory.
