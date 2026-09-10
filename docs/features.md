# Application features — M1 to M6

Product scope for the Fleet Transition Planner: 55 features covering fleet management, transition planning, freeform depot editing, calculations, and comparison. The application is a single-user local browser simulation with saved projects. Final acceptance is M6.

[Weekly tasks](weekly-plan.md) provide owners, completion weeks, and dependencies; [deliverables](deliverables.md) summarizes workstreams and milestones.

## What the final app will be like

A fleet operator opens a sample project or creates a fleet, lays out a depot, and chooses which vehicles to electrify in each year. They configure charging and economic assumptions, then move through the timeline to see the depot change. The app shows cost, emissions, suitability, and space/power constraints immediately. The operator duplicates a plan, changes its strategy, compares both plans side by side, and saves their work to reopen later.

The main experience comprises a fleet list, an interactive 3D depot, a properties/assumptions panel, a year timeline, financial/emissions results, and a comparison view. It is a decision-support simulation, not an operational fleet-control system.

## 1. Project and scenario management

- <a id="sc-01"></a>**SC-01 — Start a project:** create a fleet or open realistic synthetic sample data, with an initial depot and assumptions suitable for demonstrating the product.
- <a id="sc-02"></a>**SC-02 — Manage scenarios:** create, name, duplicate, and delete plans so users can explore alternatives without overwriting the original.
- <a id="sc-03"></a>**SC-03 — Save and reopen:** persist fleet inputs, scenario assumptions, transition schedules, depot layouts, and charger installation years in the local application's database.
- <a id="sc-04"></a>**SC-04 — Reliable editing:** show unsaved changes, save success/failure, and loading states; confirm destructive deletion and preserve edits when a save fails.

No login or account management is planned. Persistence serves one local user/workspace and is not a private multi-user service.

## 2. Fleet and vehicle management

- <a id="fl-01"></a>**FL-01 — Fleet list:** view, add, edit, and remove vehicles; represent individual vehicles and select them as groups/categories. Fleet size and vehicle type are not fixed to the illustrative 100-van example.
- <a id="fl-02"></a>**FL-02 — Operational attributes:** edit vehicle ID/type, age, annual mileage, daily distance, fuel use, route/duty cycle, depot-return pattern, available dwell time, utilisation, and planned replacement year.
- <a id="fl-03"></a>**FL-03 — Selection and grouping:** select one vehicle, arbitrary combinations, or categories such as type, age, or route suitability; filter/sort the list to find candidates.
- <a id="fl-04"></a>**FL-04 — ICE and EV assumptions:** configure relevant purchase/lease, efficiency, range, maintenance, and residual-value assumptions for the vehicles being compared.
- <a id="fl-05"></a>**FL-05 — Depot assignment:** assign vehicles to bays and clearly identify unassigned vehicles or insufficient parking capacity.

## 3. Transition planning

- <a id="tr-01"></a>**TR-01 — Assign transition years:** schedule individual vehicles or selected groups and revise or clear their schedules.
- <a id="tr-02"></a>**TR-02 — Partial and staged adoption:** support arbitrary staged plans, rapid electrification, and gradual replacement. Vehicles not scheduled to transition remain ICE.
- <a id="tr-03"></a>**TR-03 — Annual roadmap:** show the number and types of vehicles transitioning each year, with cumulative EV/ICE counts.
- <a id="tr-04"></a>**TR-04 — Year navigation:** select or scrub through an analysis year; update the depot, installed chargers, fleet state, and selected-year results from actual scenario data.

## 4. Freeform depot editor

- <a id="de-01"></a>**DE-01 — Site boundary:** draw and edit an irregular, flat site polygon rather than restricting users to a fixed rectangle.
- <a id="de-02"></a>**DE-02 — Obstacles:** create and edit polygon footprints for buildings or other areas unavailable for bays and chargers.
- <a id="de-03"></a>**DE-03 — Layout objects:** add, select, move, rotate, duplicate, resize where applicable, and delete parking bays and chargers.
- <a id="de-04"></a>**DE-04 — Precise placement:** provide visible dimensions, numeric property editing, grid snapping, and consistent real-world units.
- <a id="de-05"></a>**DE-05 — Geometry feedback:** identify self-intersecting/invalid boundaries, objects outside the site, and overlaps with other objects or obstacles. Show affected objects and understandable reasons.
- <a id="de-06"></a>**DE-06 — Edit recovery:** support undo/redo for layout changes and cancellation of an in-progress edit.
- <a id="de-07"></a>**DE-07 — Scenario layouts:** retain each plan's depot configuration when saving, duplicating, and comparing scenarios.

The agreed editor is a flat freeform site/layout editor. CAD import, terrain sculpting, site polygons with holes, and detailed cable routing are not included.

## 5. Interactive 3D visualization

- <a id="vi-01"></a>**VI-01 — Depot scene:** display the site, bays, obstacles, vehicles, and chargers using consistent scale and recognizable assets.
- <a id="vi-02"></a>**VI-02 — Camera and selection:** orbit, pan, zoom, select objects, and inspect their properties; connect viewport and list selection.
- <a id="vi-03"></a>**VI-03 — Scenario-driven changes:** show ICE vehicles becoming EVs and chargers appearing in their installation years, with readable visual distinctions.
- <a id="vi-04"></a>**VI-04 — Feasibility overlay:** highlight affected locations and show site demand against the connection limit. Turn the site red on overload and include text feedback so color is not the only signal.
- <a id="vi-05"></a>**VI-05 — Comparison scenes:** show each plan's depot state at the same selected year alongside its results.

## 6. Charging strategy and feasibility

- <a id="ch-01"></a>**CH-01 — Strategy selection:** configure depot charging, external network charging, or a mixture with an editable split.
- <a id="ch-02"></a>**CH-02 — Charger configuration:** set charger type/power, quantity, cost, location, and installation year.
- <a id="ch-03"></a>**CH-03 — Charging prices:** edit depot electricity prices, external charging tariffs, and installation costs.
- <a id="ch-04"></a>**CH-04 — Energy requirements:** estimate fleet electricity needs and depot/external charging allocation for each year.
- <a id="ch-05"></a>**CH-05 — Power constraints:** compare indicative depot demand with a fixed site connection limit; flag overloads rather than silently treating them as feasible.
- <a id="ch-06"></a>**CH-06 — Operational constraints:** flag insufficient charging availability or dwell time using the documented assumptions, including vehicles scheduled before required chargers are installed.
- <a id="ch-07"></a>**CH-07 — Space constraints:** expose inadequate room for the planned bays/chargers and connect layout conflicts to feasibility feedback.

These are indicative planning checks, not an electrical engineering certification or detailed charging-session simulation.

## 7. Financial simulation

- <a id="fi-01"></a>**FI-01 — Editable assumptions:** expose analysis period, ownership assumptions, purchase/lease costs, residual values, fuel/electricity prices, consumption, maintenance, and charging infrastructure costs.
- <a id="fi-02"></a>**FI-02 — ICE baseline:** compare the transition plan against retaining an ICE fleet under explicit replacement/ownership assumptions.
- <a id="fi-03"></a>**FI-03 — Cost results:** calculate whole-fleet TCO, transition CAPEX, annual operating costs, and differences against the baseline.
- <a id="fi-04"></a>**FI-04 — Cost breakdown:** show vehicle and infrastructure contributions, depot/external charging costs, per-vehicle cost, and cost per kilometre where meaningful.
- <a id="fi-05"></a>**FI-05 — Payback:** show cumulative costs and indicative breakeven, including a clear “not reached within the analysis period” result.
- <a id="fi-06"></a>**FI-06 — Immediate recalculation:** update results when vehicle schedules, charging choices, installation timing, or assumptions change.

## 8. Energy and emissions

- <a id="em-01"></a>**EM-01 — Energy totals:** estimate fuel displaced and electricity consumed by year and over the analysis period.
- <a id="em-02"></a>**EM-02 — Emissions comparison:** calculate ICE and transition-plan emissions and their absolute/percentage differences using visible editable factors.
- <a id="em-03"></a>**EM-03 — Explain boundaries:** label included emissions sources and units so users understand what the estimate covers.

## 9. Suitability and explanations

- <a id="su-01"></a>**SU-01 — Transition ranking:** rank candidate vehicles using daily distance versus EV range, route predictability, depot return, charging access, dwell time, replacement timing, utilisation, and economics.
- <a id="su-02"></a>**SU-02 — Explain recommendations:** show the favorable factors and constraints behind a vehicle's ranking. Rankings inform the user's choice rather than automatically committing a transition plan.
- <a id="su-03"></a>**SU-03 — Assumption impact:** explain which changed inputs drive cost/emissions differences; support manual what-if changes such as fuel/electricity prices increasing or decreasing by 20%.

## 10. Side-by-side comparison and results

- <a id="co-01"></a>**CO-01 — Choose two plans:** compare alternatives using an explicit common fleet baseline and analysis period.
- <a id="co-02"></a>**CO-02 — Compare outcomes:** display TCO, CAPEX, operating costs, payback, energy, emissions, yearly transition counts, and feasibility warnings side by side.
- <a id="co-03"></a>**CO-03 — Readable charts:** present annual and cumulative trends, breakdowns, and a transition roadmap with labels, units, and useful explanations.
- <a id="co-04"></a>**CO-04 — Inspect the same year:** coordinate year selection across both plans so differences in vehicles, chargers, and demand are understandable.

## 11. Usability and final-release quality

- <a id="qu-01"></a>**QU-01 — Accessible controls:** labeled inputs, keyboard operation for forms and editor commands, visible focus, readable contrast, and textual alternatives to color-only warnings.
- <a id="qu-02"></a>**QU-02 — Safe input handling:** understandable invalid/empty states; prevent invalid inputs from producing misleading financial results.
- <a id="qu-03"></a>**QU-03 — Transparent simulation:** keep assumptions, units, synthetic-data provenance, and the indicative nature of results visible.
- <a id="qu-04"></a>**QU-04 — Responsive interaction:** verify repeated edits, year navigation, and dual-scene comparison against a documented representative fleet/layout workload.
- <a id="qu-05"></a>**QU-05 — Verified results:** independent worked calculation examples plus automated scenario, geometry, persistence, and integration checks; real-browser visual verification.
- <a id="qu-06"></a>**QU-06 — Reproducible local app:** documented install/run/build workflow for the required Windows 11, macOS Tahoe, and Ubuntu 24.04 targets, with Ubuntu server testing.
- <a id="qu-07"></a>**QU-07 — Team delivery:** CI checks, PR review, versioned migrations, documented asset provenance, a demonstration dataset, and a final walkthrough/handover.

## M1–M6 delivery sequence

The delivery plan progresses from an integrated planning slice to the complete application and final acceptance.

| Milestone | Date (Singapore time) | Demonstrable outcome |
|---|---|---|
| M1 | 4 October 2026, 23:59 | Working vertical slice: sample fleet, editable transition year, basic ICE-versus-EV cost calculation, simple depot reflecting the selected year, and initial automated checks. |
| M2 | 8 November 2026, 23:59 | Usable planning workflow: editable fleet and assumptions, individual/group schedules, annual roadmap, scenario creation/duplication and save/load, financial and emissions results. |
| M3 | 30 November 2026 | Integrated charging and comparison: depot/external/mixed strategies, charger timing/costs, indicative power feedback, two-plan results and depot comparison, initial suitability explanations. |
| M4 | Relative weeks 1–4 | Complete freeform authoring: site polygons, obstacles, bay/charger editing, snapping, vehicle assignments, undo/redo, boundary/overlap validation, and persisted scenario layouts. |
| M5 | Relative weeks 1–4 | Complete the remaining inventory and integrate it: charging/dwell/space constraints, ranking and assumption explanations, consistent comparison behavior, finished assets, and usability/performance improvements. |
| M6 | Relative weeks 1–4 | Final acceptance and handover: all committed features demonstrated, calculation/geometry/persistence tests passing, platform evidence recorded, final usability fixes, reproducible demo and documentation. |

M4–M6 calendar dates are not set; relative weeks describe the scheduling estimate. Freeform editor investigation begins at M2 and integration is targeted for M4. Testing and CI span M1–M6.

## Scope boundaries

- Advanced sensitivity sweeps, uncertainty analysis, and regional presets.
- Multi-user accounts, team permissions, live collaboration, and publicly hosted service operation.
- Native mobile/desktop apps; the deliverable is a browser application for local demonstration.
- Route optimisation, citywide energy simulation, live telemetry, and real charging-network control/integration.
- Exhaustive tax, subsidy, financing, battery-degradation, or engineering-grade power-flow models.
- CAD/GIS import, terrain modelling, detailed cable routing, and automatic depot-layout optimisation.
- Production integration into ChargedUp Nexus.

CSV imports, report/PDF exports, and live data feeds are outside the M1–M6 scope.
