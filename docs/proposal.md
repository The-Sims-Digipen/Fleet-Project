# Fleet Transition Planner — product definition

Project scope and acceptance requirements derived from the supplied briefs, [product specification](SPECS.md), and [feature inventory](features.md). Delivery spans M1–M6.

## Problem, audience, and outcome

Fleet operators must choose which vehicles to electrify, when to replace them, and how to provide charging without exceeding depot space or power. The product helps a non-technical fleet decision maker compare those choices through visible assumptions, understandable results, and an interactive representation of the depot.

Success means a user can create or load a sample fleet, author a depot, schedule transitions, compare two alternatives against the same ICE baseline, explain their financial/emissions differences, recognize infeasible plans, and save/reopen the work. The result is indicative decision support, not an engineering certification or operational control system.

## Committed product

A single-user browser application runs locally with a Fastify API and PostgreSQL persistence. It includes fleet editing, staged transition scheduling, depot/external/mixed charging, a custom calculation engine, a flat freeform depot editor, scenario-driven 3D visualization, suitability explanations, charts, and two-plan comparison. No account or public hosting is required.

Synthetic sample data provides an immediate demonstration. Fleet size and vehicle type are not restricted to the 100-van example. Sample values are explicitly illustrative. Real operational data requires the approval described in the source specification.

The [weekly plan](weekly-plan.md) assigns delivery tasks, owners, completion weeks, and dependencies.

## Requirements and acceptance scenarios

| Requirement | Required outcome | Features | Acceptance evidence |
|---|---|---|---|
| R01 — Persistent workspace | Create/edit a fleet and create/name/duplicate/delete/save/reopen independent scenarios; failed saves preserve edits. | SC-01–SC-04, FL-01–FL-04 | AT01, AT06, AT07 |
| R02 — Transition planning | Select individuals/groups/categories, assign or clear years, and produce correct annual counts with unselected vehicles remaining ICE. | FL-03, TR-01–TR-04 | AT01, AT02 |
| R03 — Charging choice | Model depot, external, and mixed charging with charger costs, power, quantity, and installation timing. | CH-01–CH-06 | AT03, AT05 |
| R04 — Depot authoring | Draw a freeform site and obstacles; edit bays/chargers with snapping, properties, assignments, undo, and geometry feedback. | FL-05, DE-01–DE-07 | AT08, AT09 |
| R05 — 3D planning | Select and inspect the depot, view yearly ICE/EV/charger changes, and see power/space warnings in each comparison plan. | VI-01–VI-05, CH-07 | AT05, AT09, AT10 |
| R06 — Calculations | Recalculate costs, CAPEX, operating expenses, payback, energy, and emissions with explicit units and baseline conventions. | FI-01–FI-06, EM-01–EM-03 | AT01, AT03, AT04, AT11 |
| R07 — Explainable choices | Rank vehicles with operational/economic reasons and explain the impact of assumption edits. | SU-01–SU-03 | AT04, AT12 |
| R08 — Comparison | Show two independent plans with a shared analysis context and synchronized year; compare results and constraints. | CO-01–CO-04 | AT03, AT10 |
| R09 — Release quality | Accessible controls, valid inputs, transparent assumptions, responsive interaction, tested calculations and reproducible setup. | QU-01–QU-07 | AT13–AT16 |

The five source acceptance scenarios retain their meaning:

1. **AT01:** transition A now and B next year, then reverse or delay their order; verify cost, payback, emissions, annual counts, and the saved schedule.
2. **AT02:** compare selected vehicles or a category transitioning in stages with full electrification; unselected vehicles remain ICE.
3. **AT03:** keep the vehicle schedule fixed and compare depot, external, and mixed charging; infrastructure, operating cost, and result differences reflect the strategy.
4. **AT04:** change fuel/electricity prices by plus/minus 20%; recalculate and explain the changed economics without silently altering the transition schedule.
5. **AT05:** change charger quantities/years; update costs, visibility, space feedback, and red/text overload warnings.

Additional acceptance cases and evidence expectations are defined in the [verification plan](tech/verification.md).

## Boundaries

No multi-user accounts, public service hosting, native mobile/desktop clients, live telemetry, charger control, route optimization, citywide energy model, or production ChargedUp Nexus integration is included. The flat editor excludes terrain, CAD/GIS import, site holes, and cable routing. Detailed tax/subsidy/finance models and engineering-grade electrical simulation are excluded. CSV/PDF export is not promised.

Advanced sensitivity sweeps and regional presets are outside M1–M6 scope. Manual assumption edits and explanations are included.

## Delivery and provenance

M1: 4 October 2026, 23:59; M2: 8 November 2026, 23:59; M3: 30 November 2026. Times are Singapore time. M4–M6 use four relative working weeks each; calendar dates are not set. Final validation and handover occur at M6.

- [Detailed project brief: Theme 1 and shared requirements](docx/DigiPen_Upsight_Detailed_Project_1-3.docx)
- [Industry invitation: Project 1 and shared browser/3D requirements](pdf/Industry_Project_Opportunities_Student_Invitation.pdf)
- [Architecture](tech/architecture.md), [product design](design/product-design.md), and [ownership](deliverables.md)
