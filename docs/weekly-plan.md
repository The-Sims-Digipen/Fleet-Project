# Weekly technical delivery plan

## Schedule basis

- Dates use Singapore time in 2026. W01 covers 10-13 September; subsequent dated weeks run Monday-Sunday.
- M1 closes 4 October at 23:59 and M2 closes 8 November at 23:59. The M3 build is due 29 November for submission on 30 November.
- M4-M6 use four relative working weeks because their calendar dates are not set.

## Owner key

| Table name | Team member | Role |
|---|---|---|
| Ming Thong | Ooi Ming Thong | Project Manager; UX/UI Design Champion |
| Shee Yang | Chew Shee Yang | Technical Lead; Systems Integration Champion |
| Dayton | Dayton Ng Zhi Jie | Web UI Implementation Champion |
| Jarrel | Jarrel Tay Wee Han | 3D Asset & Modeling Champion |
| Elijah | Elijah Chua Jye Kang | Simulation Champion |
| Wei Jun | Tan Wei Jun | 3D Systems & Visualization Champion |
| Zhi Kai | Yap Zhi Kai | Vehicle Systems Champion |
| Brandon | Brandon Koh Kai Yang | Backend Champion |

# Features

## F01 — Core application platform and integration architecture
**Owner:** Shee Yang  
**Active:** M1 W01-W04, then integration changes as required  
**Specification:** [F01 feature spec](features/F01-core-application-platform-and-integration-architecture/README.md)

## F02 — Vehicle preset, fleet, and transition domain system
**Owner:** Zhi Kai  
**Active:** M1 W01-M2 W03  
**Specification:** [F02 feature spec](features/F02-vehicle-preset-fleet-and-transition-domain-system/README.md)

## F03 — Financial, energy, and emissions simulation engine
**Owner:** Elijah  
**Active:** M1 W01-M2 W04  
**Specification:** [F03 feature spec](features/F03-financial-energy-and-emissions-simulation-engine/README.md)

## F04 — Planning workspace and analytics interface
**Owner:** Dayton  
**Active:** M1 W02-M2 W04  
**Specification:** [F04 feature spec](features/F04-planning-workspace-and-analytics-interface/README.md)

## F05 — Data-driven 3D digital twin and viewport interaction
**Owner:** Wei Jun  
**Active:** M1 W02-M3 W04  
**Specification:** [F05 feature spec](features/F05-data-driven-3d-digital-twin-and-viewport-interaction/README.md)

## F06 — Production 3D asset library and runtime asset pipeline
**Owner:** Jarrel  
**Active:** M1 W01-M5 W03  
**Specification:** [F06 feature spec](features/F06-production-3d-asset-library-and-runtime-asset-pipeline/README.md)

## F07 — Project/scenario persistence backend
**Owner:** Brandon  
**Active:** M1 W01-M2 W04  
**Specification:** [F07 feature spec](features/F07-project-scenario-persistence-backend/README.md)

## F08 — Project and scenario workflow integration
**Owner:** Dayton  
**Active:** M2 W01–W04  
**Specification:** [F08 feature spec](features/F08-project-and-scenario-workflow-integration/README.md)

## F09 — Charging strategy and feasibility engine
**Owner:** Elijah  
**Active:** M3 W01–M5 W02  
**Specification:** [F09 feature spec](features/F09-charging-strategy-and-feasibility-engine/README.md)

## F10 — Scenario comparison and decision analytics
**Owner:** Dayton  
**Active:** M3 W01-W04  
**Specification:** [F10 feature spec](features/F10-scenario-comparison-and-decision-analytics/README.md)

## F11 — Vehicle suitability and recommendation engine
**Owner:** Zhi Kai  
**Active:** M3 W01–M5 W02  
**Specification:** [F11 feature spec](features/F11-vehicle-suitability-and-recommendation-engine/README.md)

## F12 — Dynamic scenario visualization and dual-scene comparison
**Owner:** Wei Jun  
**Active:** M3 W02–M4 W01  
**Specification:** [F12 feature spec](features/F12-dynamic-scenario-visualization-and-dual-scene-comparison/README.md)

## F13 — Freeform depot geometry and edit-history engine
**Owner:** Shee Yang  
**Active:** M4 W01-W04  
**Specification:** [F13 feature spec](features/F13-freeform-depot-geometry-and-edit-history-engine/README.md)

## F14 — 3D depot authoring tools
**Owner:** Wei Jun  
**Active:** M4 W01-W04  
**Specification:** [F14 feature spec](features/F14-3d-depot-authoring-tools/README.md)

## F15 — Depot editor panels, assignments, and issue workflow
**Owner:** Dayton  
**Active:** M4 W02–M5 W01  
**Specification:** [F15 feature spec](features/F15-depot-editor-panels-assignments-and-issue-workflow/README.md)

## F16 — Scenario layout persistence and isolation
**Owner:** Brandon  
**Active:** M4 W01-W04  
**Specification:** [F16 feature spec](features/F16-scenario-layout-persistence-and-isolation/README.md)

## F17 — End-to-end feasibility and recommendation integration
**Owner:** Shee Yang  
**Active:** M5 W01–W03  
**Specification:** [F17 feature spec](features/F17-end-to-end-feasibility-and-recommendation-integration/README.md)

## F18 — Responsive, accessible, and failure-resilient application UI
**Owner:** Dayton  
**Active:** M5 W01-M6 W02  
**Specification:** [F18 feature spec](features/F18-responsive-accessible-and-failure-resilient-application-ui/README.md)

## F19 — Backend reliability, migrations, and platform hardening
**Owner:** Brandon  
**Active:** M5 W02–M6 W02  
**Specification:** [F19 feature spec](features/F19-backend-reliability-migrations-and-platform-hardening/README.md)

## F20 — Rendering and asset performance optimization
**Owner:** Wei Jun  
**Active:** M5 W01-M6 W02  
**Specification:** [F20 feature spec](features/F20-rendering-and-asset-performance-optimization/README.md)

## F21 — Simulation and application performance engineering
**Owner:** Shee Yang  
**Active:** M5 W02-M6 W03  
**Specification:** [F21 feature spec](features/F21-simulation-and-application-performance-engineering/README.md)

## F22 — Full technical regression and release integration
**Owner:** Shee Yang  
**Active:** M6 W01-W04  
**Specification:** [F22 feature spec](features/F22-full-technical-regression-and-release-integration/README.md)

# Weekly execution plan

## M1 — working end-to-end slice

| Week / due | Active features | Expected integrated technical state |
|---|---|---|
| W01 · 10–13 Sep | F01, F02, F03, F06, F07 | Shared typed project/fleet/preset model exists; synthetic fixture loads; simulation and persistence foundations compile/test; asset pipeline has usable scaled depot/vehicle/charger content. |
| W02 · 14–20 Sep | F01–F07 | Planning shell edits real fleet/transition data; backend stores project documents; 3D viewport renders the same fixture; baseline/scenario calculations return structured results. |
| W03 · 21–27 Sep | F02–F07 | Editing a vehicle transition changes annual fleet state and cost results; saved project round-trips; selected-year fleet state drives vehicle rendering. |
| W04 · 28 Sep–4 Oct | F01–F07 | **M1 gate:** sample/new project → fleet/preset edit → generic target-preset transition → recalculated cost result → selected-year 3D update → save/reopen, with automated regression for the slice. |

## M2 — complete planning, analytics, and persistence

| Week / due | Active features | Expected integrated technical state |
|---|---|---|
| W05 · 5–11 Oct | F02, F03, F04, F07, F08 | Full preset/vehicle editing and project/scenario workflow operate on persisted data; advanced cost/ownership inputs are wired into simulation. |
| W06 · 12–18 Oct | F02, F03, F04, F08 | Filtering/grouping/bulk transitions and staged plans work; energy/emissions/payback calculations and editable assumptions are visible in the planner. |
| W07 · 19–25 Oct | F02–F04, F07, F08 | Scenario duplication/isolation, dirty/save/failure handling, roadmap data, and complete analytics charts are integrated. |
| W08 · 26 Oct–1 Nov | F03, F04, F07, F08 | Invalid-input/last-valid-result behavior, calculation edge cases, and persistence failure/stale-revision paths work end to end. |
| W09 · 2–8 Nov | F03, F04, F07, F08 | **M2 gate:** full fleet/preset management, generic staged transition planning, financial/energy/emissions analytics, project/scenario management, and reliable save/reopen pass integrated tests. |

## M3 — charging, recommendations, and scenario comparison

| Week / due | Active features | Expected integrated technical state |
|---|---|---|
| W10 · 9–15 Nov | F09, F10, F11, F12 | Charging strategies/charger inventory enter scenario state; comparison workspace can load two independent scenarios; suitability engine consumes real vehicle data. |
| W11 · 16–22 Nov | F09–F12 | Charging energy/cost/power constraints affect results; annual charger visibility and vehicle target-preset rendering work; ranking explanations are visible. |
| W12 · 23–29 Nov | F09–F12 | **M3 gate build:** depot/external/mixed charging, connection overload, two-scenario metrics/charts/3D scenes, and initial full suitability recommendations operate from persisted scenario data. |
| M3 submission · 30 Nov | F09–F12 | Build from 29 Nov is reproducible and passes the technical M3 regression set. |

## M4 — complete freeform depot authoring

| Week | Active features | Expected integrated technical state |
|---|---|---|
| M4-W1 | F13, F14, F16 | Geometry/history core works with site/obstacle/bay/charger documents; viewport can create/select core editor objects; scenario layout schema persists. |
| M4-W2 | F13–F16 | Polygon editing, transforms, snapping, numeric properties, assignment state, and geometry issue output are connected to one depot document. |
| M4-W3 | F13–F16 | Undo/redo/cancel, invalid geometry handling, vehicle-bay assignment, and save/reopen/duplicate isolation work across UI and viewport. |
| M4-W4 | F13–F16 | **M4 gate:** a depot can be authored from scratch, validated, edited with history, saved/reopened, duplicated independently, and rendered correctly in both comparison scenes. |

## M5 — full-system feasibility and technical hardening

| Week | Active features | Expected integrated technical state |
|---|---|---|
| M5-W1 | F09, F11, F15, F17, F18, F20 | Layout space issues, dwell/readiness constraints, assignments, suitability, warnings, and 3D overlays use shared integrated result/issue data. |
| M5-W2 | F17–F21 | Full decision flow is integrated; responsive/error states are hardened; server/render/simulation profiling begins on the standard workload. |
| M5-W3 | F06, F18–F21 | Asset/render/state/calculation bottlenecks identified by profiling are optimized; backend migration/failure cases and UI robustness cases are covered by regression tests. |
| M5-W4 | F18–F21 | **M5 gate:** all implementation features required before release regression are technically complete; reference workload is within target or remaining measured blockers are release defects with owners. |

## M6 — regression, platform verification, and release

| Week | Active features | Expected integrated technical state |
|---|---|---|
| M6-W1 | F18–F22 | Domain, simulation, geometry/history, persistence, browser/WebGL, comparison, and failure-recovery regression suites run against the integrated build; defects are fixed in their owning subsystem. |
| M6-W2 | F18–F22 | Clean-environment database setup/upgrades and required platform/browser builds pass; final rendering/application performance fixes land. |
| M6-W3 | F21, F22 | Final performance measurements and all affected regression suites pass on the release candidate; clean-clone production setup is reproducible. |
| M6-W4 | F22 | **M6 gate:** final production build passes the complete technical acceptance suite and is tagged as the accepted engineering release. |

---

# Main dependency paths

- **Core vertical slice:** F01 + F02 + F03 + F06 + F07 → F04 + F05 → M1 gate.
- **Persistent planning:** F02 + F03 + F07 → F04 + F08 → M2 gate.
- **Charging/comparison:** F02 + F03 → F09 + F11; F05 + F09 → F12; F09 + F11 + F12 → F10 → M3 gate.
- **Freeform depot:** F13 → F14 + F15; F07 + F13 → F16; F14 + F16 → comparison/3D integration → M4 gate.
- **Full feasibility:** F09 + F11 + F13–F16 → F17 → planning/comparison/3D outputs.
- **Release quality:** F18 + F19 + F20 + F21 → F22 → M6 gate.
