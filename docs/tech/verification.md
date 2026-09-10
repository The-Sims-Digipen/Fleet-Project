# Verification and acceptance plan

Release acceptance criteria for the M1–M6 application. The [weekly plan](../weekly-plan.md) assigns owners and deadlines. The matrix below maps all 55 features to acceptance checks; measured prototype results are reported in the [repository README](../../README.md).

## Acceptance scenarios

| ID | Scenario and required evidence | Owner / scheduled work |
|---|---|---|
| AT01 | Use two unequal vehicles; transition A now/B later, reverse and delay order, then clear A. Assert annual technology/counts, cost/emissions changes, and save/reload equality. | Zhi Kai / T010, T027, T076; Shee Yang / T014, T031 |
| AT02 | Select individuals, arbitrary combinations, and filtered categories; compare partial/staged/full adoption and verify unselected vehicles stay ICE. Include empty selection/fleet. | Zhi Kai / T021, T027, T076 |
| AT03 | Hold fleet/schedule fixed and compare depot/external/mixed costs and energy; compare two plans using the same baseline and expose retained charger CAPEX. | Elijah / T036, T041, T075 |
| AT04 | Apply plus/minus 20% fuel/electricity price changes; match F04 values and explanation scope, with no schedule mutation. | Elijah / T066, T075 |
| AT05 | Delay installation/add chargers, change connection limit, and verify installed meshes, one-time CAPEX, power/dwell issues, red and text overload indicators. | Elijah / T036, T061; Wei Jun / T040, T067 |
| AT06 | Create/name/duplicate/delete plans; edit a duplicate and prove the original is unchanged; forbid deletion of the last scenario. | Dayton / T025; Brandon / T026, T058 |
| AT07 | Save/reopen full documents; inject unavailable DB, invalid input, oversized body, unsupported versions, and stale revisions. Verify dirty edits survive and failed writes leave stored state consistent. | Brandon / T026, T058, T077 |
| AT08 | Create/edit concave sites, bow-tie rings, repeated vertices, obstacles, rotated bays/chargers; assert boundary contact, edge-crossing containment, and overlap issues without triangulation crashes. | Shee Yang / T048; Wei Jun / T051, T078 |
| AT09 | Assign/unassign bays, duplicate/delete objects, edit numerically/snap, cancel drag, undo and redo. Verify reference restoration and independent persisted scenario layouts. | Zhi Kai / T053; Wei Jun / T057, T078 |
| AT10 | Select two plans and scrub the shared year; assert charts, fleet counts, installed chargers, and each independent scene agree with their own results. | Wei Jun / T043; Shee Yang / T044 |
| AT11 | Independently reproduce F01–F05; test zero denominators, residual disposal, delayed transition after replacement, lease exits, and unreached payback. Never allow nonfinite outputs. | Elijah / T033, T075 |
| AT12 | Verify every suitability factor/point and stable tie ordering, unconstrained-candidate-first ordering, and explanations. Confirm rankings do not mutate plans. | Zhi Kai / T065, T076 |
| AT13 | Keyboard-only forms/toolbars/transform editing; labeled controls, visible focus, error association, last-valid-input labels, text overload feedback, and understandable empty states. | Ming Thong / T071, T084; Dayton / T072, T086 |
| AT14 | Profile reference workload using the method below; record calculation/update timings, frame behavior, and no memory growth from repeated scene switches beyond cache warmup. | Wei Jun / T067, T073; Shee Yang / T070 |
| AT15 | Clean clone/install/build/test on exact required operating systems; new and upgraded DB setup, local server readiness, restart persistence, and documented recovery. | Shee Yang / T079; Brandon / T080; Dayton / T081 |
| AT16 | Final demo/reset works from instructions; CI/PR evidence, asset provenance, feature audit, limitations, and handover are complete. | Jarrel / T082; Ming Thong / T084, T088; Shee Yang / T087 |

## Verification coverage

| Layer | Evidence |
|---|---|
| Calculations | Independent [worked examples](simulation.md#synthetic-worked-fixtures), deterministic results, boundary cases, and unchanged inputs |
| Geometry | Concave boundaries, edge contact, intersections, rotated footprints, and invalid-shape handling |
| Persistence | Save/load equality, transactions, revision conflicts, error recovery, and database upgrades |
| Interface | Forms, selection, edit history, save states, keyboard access, and comparison controls |
| Browser | Actual WebGL picking, camera interaction, polygon tools, dual scenes, and rendering performance |

## Reference workload and performance targets

Acceptance workload: 100 individual vehicles, 10 analysis years, two scenarios shown together, 200 bays, 20 chargers, and 20 obstacles of up to 20 vertices each, at 1920×1080 CSS pixels with device pixel ratio capped at 1 for measurement. This is a reproducible test fixture, not an application fleet-size restriction. The workload uses synthetic data.

After five warmup evaluations, measure 100 committed input changes. Target simulation p95 <= 100 ms and edit-to-visible-results p95 <= 250 ms on the recorded reference machine. During a 60-second orbit/timeline interaction, target median >= 30 FPS with no application-caused stall > 1 second. Report browser/version, OS, CPU, RAM, GPU, power mode, viewport, dataset, and raw samples. Profile repeated project/scene switches over 20 cycles for retained scenes/listeners; investigate monotonic growth after warmup.

## Milestone gates and evidence

M1 proves the sample-to-result-to-scene slice. M2 adds fleet editing, financial/emissions results, and reliable persistence. M3 proves charging and two-plan comparison. M4 proves freeform editing/history/layout persistence. M5 completes the feature inventory and performance/usability work. M6 runs final acceptance/platform evidence and handover. Dates and relative working weeks are recorded in the [weekly plan](../weekly-plan.md).

Acceptance evidence identifies the build, test environment, data version, expected/actual results, and any failures. A requirement passes only when its checks pass in the integrated application. T074 covers feature completeness and T084 final acceptance.

## Feature-to-test traceability

Each row identifies a feature, its primary integration task, accountable owner, milestone target, and acceptance checks. Feature links open the full description.

| Feature | Primary task / accountable owner | Integration milestone | Acceptance |
|---|---|---|---|
| [SC-01 — Start a project](../features.md#sc-01) | T025 / Dayton | M2 | AT01, AT06 |
| [SC-02 — Manage scenarios](../features.md#sc-02) | T025 / Dayton | M2 | AT06 |
| [SC-03 — Save and reopen](../features.md#sc-03) | T050 / Brandon | M4 | AT07, AT09 |
| [SC-04 — Reliable editing](../features.md#sc-04) | T058 / Brandon | M4 | AT07, AT13 |
| [FL-01 — Fleet list](../features.md#fl-01) | T020 / Dayton | M2 | AT01, AT02 |
| [FL-02 — Operational attributes](../features.md#fl-02) | T020 / Dayton | M2 | AT01, AT13 |
| [FL-03 — Selection and grouping](../features.md#fl-03) | T021 / Zhi Kai | M2 | AT02 |
| [FL-04 — ICE and EV assumptions](../features.md#fl-04) | T020 / Dayton | M2 | AT11 |
| [FL-05 — Depot assignment](../features.md#fl-05) | T056 / Dayton | M4 | AT09 |
| [TR-01 — Assign transition years](../features.md#tr-01) | T021 / Zhi Kai | M2 | AT01, AT02 |
| [TR-02 — Partial and staged adoption](../features.md#tr-02) | T027 / Zhi Kai | M2 | AT02 |
| [TR-03 — Annual roadmap](../features.md#tr-03) | T029 / Dayton | M2 | AT01, AT02 |
| [TR-04 — Year navigation](../features.md#tr-04) | T012 / Dayton | M1 | AT01, AT10 |
| [DE-01 — Site boundary](../features.md#de-01) | T051 / Wei Jun | M4 | AT08 |
| [DE-02 — Obstacles](../features.md#de-02) | T051 / Wei Jun | M4 | AT08 |
| [DE-03 — Layout objects](../features.md#de-03) | T054 / Wei Jun | M4 | AT09 |
| [DE-04 — Precise placement](../features.md#de-04) | T054 / Wei Jun | M4 | AT09, AT13 |
| [DE-05 — Geometry feedback](../features.md#de-05) | T056 / Dayton | M4 | AT08, AT09 |
| [DE-06 — Edit recovery](../features.md#de-06) | T057 / Wei Jun | M4 | AT09 |
| [DE-07 — Scenario layouts](../features.md#de-07) | T058 / Brandon | M4 | AT07, AT09 |
| [VI-01 — Depot scene](../features.md#vi-01) | T068 / Jarrel | M5 | AT05, AT09, AT16 |
| [VI-02 — Camera and selection](../features.md#vi-02) | T073 / Wei Jun | M5 | AT09, AT14 |
| [VI-03 — Scenario-driven changes](../features.md#vi-03) | T040 / Wei Jun | M3 | AT01, AT05 |
| [VI-04 — Feasibility overlay](../features.md#vi-04) | T067 / Wei Jun | M5 | AT05, AT09 |
| [VI-05 — Comparison scenes](../features.md#vi-05) | T057 / Wei Jun | M4 | AT09, AT10 |
| [CH-01 — Strategy selection](../features.md#ch-01) | T039 / Dayton | M3 | AT03 |
| [CH-02 — Charger configuration](../features.md#ch-02) | T039 / Dayton | M3 | AT03, AT05 |
| [CH-03 — Charging prices](../features.md#ch-03) | T039 / Dayton | M3 | AT03, AT04 |
| [CH-04 — Energy requirements](../features.md#ch-04) | T041 / Elijah | M3 | AT03, AT11 |
| [CH-05 — Power constraints](../features.md#ch-05) | T040 / Wei Jun | M3 | AT05 |
| [CH-06 — Operational constraints](../features.md#ch-06) | T069 / Dayton | M5 | AT05 |
| [CH-07 — Space constraints](../features.md#ch-07) | T069 / Dayton | M5 | AT08, AT09 |
| [FI-01 — Editable assumptions](../features.md#fi-01) | T020 / Dayton | M2 | AT04, AT11 |
| [FI-02 — ICE baseline](../features.md#fi-02) | T033 / Elijah | M2 | AT11 |
| [FI-03 — Cost results](../features.md#fi-03) | T033 / Elijah | M2 | AT01, AT11 |
| [FI-04 — Cost breakdown](../features.md#fi-04) | T036 / Elijah | M3 | AT03, AT11 |
| [FI-05 — Payback](../features.md#fi-05) | T033 / Elijah | M2 | AT11 |
| [FI-06 — Immediate recalculation](../features.md#fi-06) | T070 / Shee Yang | M5 | AT04, AT14 |
| [EM-01 — Energy totals](../features.md#em-01) | T029 / Dayton | M2 | AT03, AT11 |
| [EM-02 — Emissions comparison](../features.md#em-02) | T033 / Elijah | M2 | AT11 |
| [EM-03 — Explain boundaries](../features.md#em-03) | T029 / Dayton | M2 | AT11, AT13 |
| [SU-01 — Transition ranking](../features.md#su-01) | T069 / Dayton | M5 | AT12 |
| [SU-02 — Explain recommendations](../features.md#su-02) | T069 / Dayton | M5 | AT12 |
| [SU-03 — Assumption impact](../features.md#su-03) | T069 / Dayton | M5 | AT04, AT12 |
| [CO-01 — Choose two plans](../features.md#co-01) | T039 / Dayton | M3 | AT06, AT10 |
| [CO-02 — Compare outcomes](../features.md#co-02) | T069 / Dayton | M5 | AT03, AT10 |
| [CO-03 — Readable charts](../features.md#co-03) | T042 / Dayton | M3 | AT10, AT13 |
| [CO-04 — Inspect the same year](../features.md#co-04) | T043 / Wei Jun | M3 | AT10 |
| [QU-01 — Accessible controls](../features.md#qu-01) | T086 / Dayton | M6 | AT13 |
| [QU-02 — Safe input handling](../features.md#qu-02) | T086 / Dayton | M6 | AT07, AT13 |
| [QU-03 — Transparent simulation](../features.md#qu-03) | T084 / Ming Thong | M6 | AT11, AT13, AT16 |
| [QU-04 — Responsive interaction](../features.md#qu-04) | T073 / Wei Jun | M5 | AT14 |
| [QU-05 — Verified results](../features.md#qu-05) | T087 / Shee Yang | M6 | AT01–AT16 |
| [QU-06 — Reproducible local app](../features.md#qu-06) | T083 / Shee Yang | M6 | AT15 |
| [QU-07 — Team delivery](../features.md#qu-07) | T088 / Ming Thong | M6 | AT16 |
