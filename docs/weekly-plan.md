# Weekly delivery plan and ownership

Delivery schedule for all 55 features, with 88 tasks, accountable owners, completion weeks, and prerequisite tasks. Feature IDs link to the [feature inventory](features.md). This is the delivery plan, not a completion report.

## Schedule basis

- Dates use Singapore time in 2026. W01 covers 10–13 September; subsequent dated weeks run Monday–Sunday.
- Tasks are due at the end of the listed week. M1 closes 4 October at 23:59 and M2 closes 8 November at 23:59. The M3 build is due 29 November for submission on 30 November.
- M4–M6 use four relative working weeks each because their calendar dates are not set. These blocks are scheduling estimates.
- Prerequisites define integration order. Each owner is accountable for the deliverable, relevant testing, review, and integrated result.

## Owner key

| Table name | Accountable team member | Role |
|---|---|---|
| Ming Thong | Ooi Ming Thong | Project Manager; UX/UI Design Champion |
| Shee Yang | Chew Shee Yang | Technical Lead; Systems Integration Champion |
| Dayton | Dayton Ng Zhi Jie | Web UI Implementation Champion |
| Jarrel | Jarrel Tay Wee Han | 3D Asset & Modeling Champion |
| Elijah | Elijah Chua Jye Kang | Simulation Champion |
| Wei Jun | Tan Wei Jun | 3D Systems & Visualization Champion |
| Zhi Kai | Yap Zhi Kai | Vehicle Systems Champion |
| Brandon | Brandon Koh Kai Yang | Backend Champion |

## M1 — working end-to-end slice

| Week / due | Task | Owner | Deliverable and acceptance evidence | Features | Prerequisites |
|---|---|---|---|---|---|
| W01 · 10–13 Sep | T001 | Ming Thong | Review main user flow, scope, and milestone acceptance checklist; publish annotated initial wireframes. | [SC-01](features.md#sc-01), [QU-01](features.md#qu-01), [QU-03](features.md#qu-03) | None |
| W01 · 10–13 Sep | T002 | Zhi Kai | Define vehicle attributes, units, stable IDs, and a synthetic sample fleet with documented provenance. | [FL-01](features.md#fl-01), [FL-02](features.md#fl-02), [QU-03](features.md#qu-03) | None |
| W01 · 10–13 Sep | T003 | Elijah | Document annual time steps, ICE replacement baseline, cost/emissions conventions, and independently worked reference cases. | [FI-01](features.md#fi-01), [FI-02](features.md#fi-02), [EM-03](features.md#em-03), [QU-05](features.md#qu-05) | None |
| W02 · 14–20 Sep | T004 | Shee Yang | Agree and publish fleet/scenario/result/layout interfaces with domain owners; provide shared fixtures and a dependency map. | [SC-03](features.md#sc-03), [FI-06](features.md#fi-06), [DE-07](features.md#de-07) | T002, T003 |
| W02 · 14–20 Sep | T005 | Shee Yang | Add CI typecheck/test/build checks and PR evidence conventions; demonstrate a passing run. | [QU-07](features.md#qu-07) | None |
| W02 · 14–20 Sep | T006 | Dayton | Build the sample-project shell, fleet list, and transition-year input using agreed fixtures. | [SC-01](features.md#sc-01), [FL-01](features.md#fl-01), [TR-01](features.md#tr-01) | T001, T004 |
| W02 · 14–20 Sep | T007 | Jarrel | Deliver initial ICE/EV vehicle, bay, and charger assets; document scale, orientation, and provenance. | [VI-01](features.md#vi-01), [VI-03](features.md#vi-03), [QU-07](features.md#qu-07) | T002 |
| W02 · 14–20 Sep | T008 | Brandon | Define local database schema/API contracts and versioned migration approach; document local setup. | [SC-03](features.md#sc-03), [QU-06](features.md#qu-06), [QU-07](features.md#qu-07) | T004 |
| W03 · 21–27 Sep | T009 | Elijah | Implement baseline and scheduled-transition annual cost functions; match T003 reference cases. | [FI-02](features.md#fi-02), [FI-03](features.md#fi-03) | T003, T004 |
| W03 · 21–27 Sep | T010 | Zhi Kai | Implement year assignment/clearing and annual ICE/EV state; test that unscheduled vehicles remain ICE. | [TR-01](features.md#tr-01), [TR-02](features.md#tr-02), [TR-03](features.md#tr-03) | T002, T004 |
| W03 · 21–27 Sep | T011 | Wei Jun | Render a simple sample depot using assets; connect vehicle selection and camera controls. | [VI-01](features.md#vi-01), [VI-02](features.md#vi-02) | T004, T007 |
| W03 · 21–27 Sep | T012 | Dayton | Connect year navigation and basic cost results to fleet edits; demonstrate immediate recalculation. | [TR-04](features.md#tr-04), [FI-06](features.md#fi-06) | T006, T009, T010 |
| W04 · 28 Sep–4 Oct | T013 | Wei Jun | Connect selected-year vehicle state to the scene; verify ICE/EV changes in a browser. | [VI-03](features.md#vi-03), [TR-04](features.md#tr-04) | T010, T011 |
| W04 · 28 Sep–4 Oct | T014 | Shee Yang | Integrate and test sample load → transition edit → cost change → depot update; prepare M1 build. | [SC-01](features.md#sc-01), [FI-06](features.md#fi-06), [QU-05](features.md#qu-05) | T005, T012, T013 |
| W04 · 28 Sep–4 Oct | T015 | Ming Thong | Run the M1 walkthrough, record acceptance evidence and usability defects, and prepare the submission. | [QU-01](features.md#qu-01), [QU-07](features.md#qu-07) | T014 |

## M2 — usable planning and persistence

| Week / due | Task | Owner | Deliverable and acceptance evidence | Features | Prerequisites |
|---|---|---|---|---|---|
| W05 · 5–11 Oct | T016 | Zhi Kai | Implement vehicle create/edit/remove, operational attributes, and domain validation; test invalid records. | [FL-01](features.md#fl-01), [FL-02](features.md#fl-02), [QU-02](features.md#qu-02) | T010 |
| W05 · 5–11 Oct | T017 | Brandon | Implement local PostgreSQL migrations and fleet/scenario CRUD with validated save/load contracts and API tests. | [SC-02](features.md#sc-02), [SC-03](features.md#sc-03), [QU-07](features.md#qu-07) | T008 |
| W05 · 5–11 Oct | T018 | Elijah | Complete ownership/purchase/lease/residual assumptions and annual financial breakdown calculations. | [FL-04](features.md#fl-04), [FI-01](features.md#fi-01), [FI-03](features.md#fi-03), [FI-04](features.md#fi-04) | T009 |
| W05 · 5–11 Oct | T019 | Ming Thong | Specify project/scenario management, validation, and save-failure interaction states; review with Dayton. | [SC-02](features.md#sc-02), [SC-04](features.md#sc-04), [QU-02](features.md#qu-02) | T015 |
| W06 · 12–18 Oct | T020 | Dayton | Implement vehicle forms and economic assumption controls with units, accessible labels, and validation. | [FL-01](features.md#fl-01), [FL-02](features.md#fl-02), [FL-04](features.md#fl-04), [FI-01](features.md#fi-01), [QU-01](features.md#qu-01), [QU-02](features.md#qu-02) | T016, T018, T019 |
| W06 · 12–18 Oct | T021 | Zhi Kai | Add list filtering/sorting, arbitrary selection, category grouping, and bulk transition changes. | [FL-03](features.md#fl-03), [TR-01](features.md#tr-01), [TR-02](features.md#tr-02) | T016 |
| W06 · 12–18 Oct | T022 | Elijah | Implement energy/emissions results and cumulative breakeven, including unreached payback and zero-distance cases. | [EM-01](features.md#em-01), [EM-02](features.md#em-02), [EM-03](features.md#em-03), [FI-05](features.md#fi-05) | T018 |
| W06 · 12–18 Oct | T023 | Wei Jun | Investigate polygon editing, overlap checks, snapping, and undo integration; document geometry risks and a tested prototype. | [DE-01](features.md#de-01), [DE-04](features.md#de-04), [DE-05](features.md#de-05), [DE-06](features.md#de-06) | T011 |
| W06 · 12–18 Oct | T024 | Jarrel | Refine vehicle and charger asset variants and measure representative scene asset costs. | [VI-01](features.md#vi-01), [VI-03](features.md#vi-03), [QU-04](features.md#qu-04) | T007, T011 |
| W07 · 19–25 Oct | T025 | Dayton | Integrate create/name/duplicate/delete scenarios and save/load UI; show dirty, loading, success, and failure states. | [SC-01](features.md#sc-01), [SC-02](features.md#sc-02), [SC-03](features.md#sc-03), [SC-04](features.md#sc-04) | T017, T019, T020 |
| W07 · 19–25 Oct | T026 | Brandon | Test persistence round trips and failures; failed saves preserve prior stored data and return useful errors. | [SC-03](features.md#sc-03), [SC-04](features.md#sc-04), [QU-05](features.md#qu-05) | T017 |
| W07 · 19–25 Oct | T027 | Zhi Kai | Produce annual counts/roadmap data for categories and staged replacement; verify reversed and delayed ordering. | [TR-02](features.md#tr-02), [TR-03](features.md#tr-03) | T021 |
| W07 · 19–25 Oct | T028 | Shee Yang | Agree geometry contracts and validation approach from the prototype; include layout versioning in persistence contracts. | [DE-01](features.md#de-01), [DE-05](features.md#de-05), [DE-07](features.md#de-07) | T004, T008, T023 |
| W08 · 26 Oct–1 Nov | T029 | Dayton | Display annual roadmap, costs/breakdowns, payback, energy, and emissions charts with units and simulation labels. | [TR-03](features.md#tr-03), [FI-03](features.md#fi-03), [FI-04](features.md#fi-04), [FI-05](features.md#fi-05), [EM-01](features.md#em-01), [EM-02](features.md#em-02), [EM-03](features.md#em-03), [CO-03](features.md#co-03), [QU-03](features.md#qu-03) | T020, T022, T027 |
| W08 · 26 Oct–1 Nov | T030 | Ming Thong | Review planning and save/load flows with representative users; record findings and concrete acceptance failures. | [QU-01](features.md#qu-01), [QU-02](features.md#qu-02), [SC-04](features.md#sc-04) | T025, T029 |
| W08 · 26 Oct–1 Nov | T031 | Shee Yang | Test scenario isolation, persistence integration, and invalid-input protection across UI and calculations. | [SC-03](features.md#sc-03), [SC-04](features.md#sc-04), [FI-06](features.md#fi-06), [QU-02](features.md#qu-02), [QU-05](features.md#qu-05) | T025, T026, T029 |
| W09 · 2–8 Nov | T032 | Dayton | Resolve M2 UI defects and verify keyboard controls, save-failure recovery, and delete confirmation. | [SC-04](features.md#sc-04), [QU-01](features.md#qu-01), [QU-02](features.md#qu-02) | T030, T031 |
| W09 · 2–8 Nov | T033 | Elijah | Independently reconcile financial/emissions results against reference cases; resolve mismatches. | [FI-02](features.md#fi-02), [FI-03](features.md#fi-03), [FI-04](features.md#fi-04), [FI-05](features.md#fi-05), [EM-02](features.md#em-02), [QU-05](features.md#qu-05) | T022, T031 |
| W09 · 2–8 Nov | T034 | Shee Yang | Produce the integrated M2 build and acceptance evidence for planning, save/load, and results. | [QU-05](features.md#qu-05), [QU-07](features.md#qu-07) | T032, T033 |
| W09 · 2–8 Nov | T035 | Ming Thong | Review M2 acceptance and submit the demo; finalize annotated charging/comparison designs for M3. | [CH-01](features.md#ch-01), [CO-01](features.md#co-01), [QU-07](features.md#qu-07) | T034 |

## M3 — charging and two-plan comparison

| Week / due | Task | Owner | Deliverable and acceptance evidence | Features | Prerequisites |
|---|---|---|---|---|---|
| W10 · 9–15 Nov | T036 | Elijah | Implement depot/external/mixed energy allocation, charging costs, installation timing, and indicative power demand. | [CH-01](features.md#ch-01), [CH-02](features.md#ch-02), [CH-03](features.md#ch-03), [CH-04](features.md#ch-04), [CH-05](features.md#ch-05), [FI-04](features.md#fi-04) | T033 |
| W10 · 9–15 Nov | T037 | Brandon | Persist charger settings and installation years with migrations and round-trip tests. | [CH-02](features.md#ch-02), [SC-03](features.md#sc-03) | T026, T028 |
| W10 · 9–15 Nov | T038 | Zhi Kai | Implement initial suitability factors and reason codes for range, operations, timing, and economics. | [SU-01](features.md#su-01), [SU-02](features.md#su-02) | T021, T022 |
| W10 · 9–15 Nov | T039 | Dayton | Add charger/strategy/tariff controls and choose-two-plan UI with a visible shared comparison baseline. | [CH-01](features.md#ch-01), [CH-02](features.md#ch-02), [CH-03](features.md#ch-03), [CO-01](features.md#co-01) | T035, T037 |
| W11 · 16–22 Nov | T040 | Wei Jun | Show chargers by installation year and demand/limit overlays with red overload and text feedback. | [VI-03](features.md#vi-03), [VI-04](features.md#vi-04), [CH-05](features.md#ch-05) | T013, T024, T036 |
| W11 · 16–22 Nov | T041 | Elijah | Produce comparable annual result sets for two plans; test shared baseline, charging splits, and delayed installation. | [CO-02](features.md#co-02), [CH-04](features.md#ch-04), [CH-05](features.md#ch-05), [FI-06](features.md#fi-06) | T036 |
| W11 · 16–22 Nov | T042 | Dayton | Integrate comparison results/charts and initial suitability explanations into the UI. | [CO-02](features.md#co-02), [CO-03](features.md#co-03), [SU-01](features.md#su-01), [SU-02](features.md#su-02) | T029, T038, T039, T041 |
| W12 · 23–29 Nov | T043 | Wei Jun | Render both scenario depots with coordinated year selection and isolated scene state. | [VI-05](features.md#vi-05), [CO-04](features.md#co-04) | T040, T041 |
| W12 · 23–29 Nov | T044 | Shee Yang | Integrate and verify charging controls, two-plan views, persistence, and same-year results; prepare M3 build. | [CH-01](features.md#ch-01), [CH-05](features.md#ch-05), [CO-01](features.md#co-01), [CO-02](features.md#co-02), [CO-04](features.md#co-04), [QU-05](features.md#qu-05) | T037, T042, T043 |
| W12 · 23–29 Nov | T045 | Ming Thong | Review M3 walkthrough and evidence, including overload visibility and understandable comparisons. | [QU-01](features.md#qu-01), [QU-03](features.md#qu-03), [QU-07](features.md#qu-07) | T044 |
| 30 Nov · submission only | T046 | Ming Thong | Submit the accepted M3 build and evidence. | [QU-07](features.md#qu-07) | T045 |

## M4 — freeform depot authoring (relative working weeks)

| Week / due | Task | Owner | Deliverable and acceptance evidence | Features | Prerequisites |
|---|---|---|---|---|---|
| M4-W1 | T047 | Ming Thong | Finalize freeform editor flows, placement/error feedback, keyboard commands, and annotated wireframes. | [DE-01](features.md#de-01), [DE-02](features.md#de-02), [DE-03](features.md#de-03), [DE-05](features.md#de-05), [QU-01](features.md#qu-01) | T023, T035 |
| M4-W1 | T048 | Shee Yang | Implement/test pure polygon validity, containment, and overlap functions with agreed geometry conventions. | [DE-05](features.md#de-05) | T028 |
| M4-W1 | T049 | Jarrel | Deliver obstacle/depot assets and selectable footprints matched to actual bounds and units. | [DE-02](features.md#de-02), [VI-01](features.md#vi-01) | T024, T028 |
| M4-W1 | T050 | Brandon | Implement versioned layout persistence/duplication and migration round-trip tests. | [DE-07](features.md#de-07), [SC-03](features.md#sc-03) | T028, T037 |
| M4-W2 | T051 | Wei Jun | Implement site/obstacle polygon creation and vertex editing; display invalid polygon feedback. | [DE-01](features.md#de-01), [DE-02](features.md#de-02), [DE-05](features.md#de-05) | T047, T048, T049 |
| M4-W2 | T052 | Dayton | Implement layout object/property panel, dimensions, transform inputs, and edit commands against editor contracts. | [DE-03](features.md#de-03), [DE-04](features.md#de-04) | T028, T047 |
| M4-W2 | T053 | Zhi Kai | Implement stable vehicle-to-bay assignments and missing/duplicate/capacity validation with tests. | [FL-05](features.md#fl-05) | T027, T028 |
| M4-W3 | T054 | Wei Jun | Implement bay/charger add, move, rotate, duplicate, resize, delete, and snapping in the viewport. | [DE-03](features.md#de-03), [DE-04](features.md#de-04) | T051, T052 |
| M4-W3 | T055 | Shee Yang | Implement transaction-based layout history and cancel behavior using existing editor conventions. | [DE-06](features.md#de-06) | T048, T051, T054 |
| M4-W3 | T056 | Dayton | Connect bay assignments, placement conflict messages, and save/reopen/duplicate layout interactions. | [FL-05](features.md#fl-05), [DE-05](features.md#de-05), [DE-07](features.md#de-07) | T050, T052, T053, T054 |
| M4-W4 | T057 | Wei Jun | Verify full editing/undo flow and independent layouts in both 3D comparison scenes. | [DE-06](features.md#de-06), [DE-07](features.md#de-07), [VI-05](features.md#vi-05) | T043, T055, T056 |
| M4-W4 | T058 | Brandon | Verify saved layout/history boundaries, migration failures, and no cross-scenario layout mutation. | [SC-04](features.md#sc-04), [DE-07](features.md#de-07), [QU-05](features.md#qu-05) | T050, T056 |
| M4-W4 | T059 | Ming Thong | Run editor usability acceptance and record defects/evidence for all seven editor features. | [DE-01](features.md#de-01), [DE-02](features.md#de-02), [DE-03](features.md#de-03), [DE-04](features.md#de-04), [DE-05](features.md#de-05), [DE-06](features.md#de-06), [DE-07](features.md#de-07), [QU-01](features.md#qu-01) | T057, T058 |
| M4-W4 | T060 | Shee Yang | Resolve integration blockers and publish the accepted M4 build with geometry/browser evidence. | [QU-05](features.md#qu-05), [QU-07](features.md#qu-07) | T059 |

## M5 — complete features and harden interaction (relative working weeks)

| Week / due | Task | Owner | Deliverable and acceptance evidence | Features | Prerequisites |
|---|---|---|---|---|---|
| M5-W1 | T061 | Elijah | Implement dwell-time, charger-availability, and installation-readiness checks with worked constraint cases. | [CH-06](features.md#ch-06) | T036, T041 |
| M5-W1 | T062 | Shee Yang | Translate layout conflicts and bay/charger shortages into scenario-level space feasibility results. | [CH-07](features.md#ch-07) | T048, T053, T060 |
| M5-W1 | T063 | Ming Thong | Document the reference workload, test hardware, and performance measurement method against the acceptance budgets. | [QU-04](features.md#qu-04) | T044, T060 |
| M5-W1 | T064 | Brandon | Verify local server/database setup and tests on Ubuntu 24.04; document prerequisites and recovery steps. | [QU-06](features.md#qu-06) | T058 |
| M5-W2 | T065 | Zhi Kai | Complete suitability scoring/reasons using charging access, dwell, timing, utilisation, and economics; test rankings. | [SU-01](features.md#su-01), [SU-02](features.md#su-02) | T038, T061, T062 |
| M5-W2 | T066 | Elijah | Implement assumption-impact explanations and reconcile plus/minus 20% price cases with reference results. | [SU-03](features.md#su-03), [FI-06](features.md#fi-06) | T041, T061 |
| M5-W2 | T067 | Wei Jun | Connect space/operational constraints to both scenes and profile interaction against the agreed workload. | [VI-04](features.md#vi-04), [CH-06](features.md#ch-06), [CH-07](features.md#ch-07), [QU-04](features.md#qu-04) | T057, T061, T062, T063 |
| M5-W2 | T068 | Jarrel | Finalize and optimize assets from profiling feedback; complete source/license documentation. | [VI-01](features.md#vi-01), [QU-04](features.md#qu-04), [QU-07](features.md#qu-07) | T049, T063, T067 |
| M5-W3 | T069 | Dayton | Integrate final rankings, impact explanations, and all feasibility warnings into both result views. | [SU-01](features.md#su-01), [SU-02](features.md#su-02), [SU-03](features.md#su-03), [CO-02](features.md#co-02), [CH-06](features.md#ch-06), [CH-07](features.md#ch-07) | T065, T066, T067 |
| M5-W3 | T070 | Shee Yang | Profile and improve repeated recalculation, state updates, and save integration; record budget results. | [FI-06](features.md#fi-06), [QU-04](features.md#qu-04) | T063, T066, T069 |
| M5-W3 | T071 | Ming Thong | Perform full usability/accessibility review; verify assumptions, emissions boundaries, labels, and failure messages. | [QU-01](features.md#qu-01), [QU-02](features.md#qu-02), [QU-03](features.md#qu-03) | T068, T069 |
| M5-W4 | T072 | Dayton | Resolve UI review defects and verify keyboard/empty/invalid/failure states across the product. | [SC-04](features.md#sc-04), [QU-01](features.md#qu-01), [QU-02](features.md#qu-02), [QU-03](features.md#qu-03) | T071 |
| M5-W4 | T073 | Wei Jun | Resolve remaining viewport performance/interaction defects; demonstrate measured dual-scene behavior. | [VI-02](features.md#vi-02), [VI-05](features.md#vi-05), [QU-04](features.md#qu-04) | T068, T070, T071 |
| M5-W4 | T074 | Shee Yang | Audit all 55 feature IDs against integrated evidence; publish the M5 feature-complete build and remaining defect list. | [QU-05](features.md#qu-05), [QU-07](features.md#qu-07) | T064, T072, T073 |

## M6 — final validation and handover (relative working weeks)

| Week / due | Task | Owner | Deliverable and acceptance evidence | Features | Prerequisites |
|---|---|---|---|---|---|
| M6-W1 | T075 | Elijah | Independently audit cost, payback, energy, emissions, and assumption-impact cases; resolve numerical defects. | [FI-02](features.md#fi-02), [FI-03](features.md#fi-03), [FI-04](features.md#fi-04), [FI-05](features.md#fi-05), [EM-01](features.md#em-01), [EM-02](features.md#em-02), [SU-03](features.md#su-03), [QU-05](features.md#qu-05) | T074 |
| M6-W1 | T076 | Zhi Kai | Audit fleet CRUD, grouping, ordering, annual counts, assignments, and suitability edge cases. | [FL-01](features.md#fl-01), [FL-03](features.md#fl-03), [FL-05](features.md#fl-05), [TR-01](features.md#tr-01), [TR-02](features.md#tr-02), [TR-03](features.md#tr-03), [SU-01](features.md#su-01), [QU-05](features.md#qu-05) | T074 |
| M6-W1 | T077 | Brandon | Test empty/new/upgraded databases, round trips, and error recovery; fix persistence defects. | [SC-03](features.md#sc-03), [SC-04](features.md#sc-04), [DE-07](features.md#de-07), [QU-05](features.md#qu-05) | T074 |
| M6-W1 | T078 | Wei Jun | Run geometry/browser regression cases for invalid polygons, overlaps, edit cancellation, undo, and comparison isolation. | [DE-05](features.md#de-05), [DE-06](features.md#de-06), [DE-07](features.md#de-07), [VI-05](features.md#vi-05), [QU-05](features.md#qu-05) | T074 |
| M6-W2 | T079 | Shee Yang | Verify clean-clone install/typecheck/test/build on Windows 11 and integrate regression fixes. | [QU-05](features.md#qu-05), [QU-06](features.md#qu-06) | T075, T076, T077, T078 |
| M6-W2 | T080 | Brandon | Verify clean-clone setup/build and server tests on Ubuntu 24.04; capture exact environment evidence. | [QU-06](features.md#qu-06) | T064, T077 |
| M6-W2 | T081 | Dayton | Verify clean-clone setup/build on macOS Tahoe and browser workflows; record platform-specific fixes. | [QU-06](features.md#qu-06) | T072, T074 |
| M6-W2 | T082 | Jarrel | Audit shipped assets, attribution, dimensions, and demo scene completeness against the final build. | [VI-01](features.md#vi-01), [QU-07](features.md#qu-07) | T068, T078 |
| M6-W3 | T083 | Shee Yang | Integrate platform fixes and rerun affected checks; prepare release candidate with reproducible setup instructions. | [QU-05](features.md#qu-05), [QU-06](features.md#qu-06), [QU-07](features.md#qu-07) | T079, T080, T081, T082 |
| M6-W3 | T084 | Ming Thong | Run final user acceptance against the 55-feature matrix and original five scenarios; record defects and pass/fail evidence. | [QU-01](features.md#qu-01), [QU-03](features.md#qu-03), [QU-05](features.md#qu-05) | T083 |
| M6-W3 | T085 | Zhi Kai | Package the deterministic demo fleet/scenarios and reset instructions for the final walkthrough. | [SC-01](features.md#sc-01), [QU-03](features.md#qu-03), [QU-07](features.md#qu-07) | T076, T083 |
| M6-W4 | T086 | Dayton | Resolve final UI acceptance defects and verify affected interactions. | [QU-01](features.md#qu-01), [QU-02](features.md#qu-02) | T084 |
| M6-W4 | T087 | Shee Yang | Triage final technical defects to domain owners, integrate fixes, rerun affected checks, and tag the accepted release. | [QU-05](features.md#qu-05), [QU-06](features.md#qu-06), [QU-07](features.md#qu-07) | T084, T085, T086 |
| M6-W4 | T088 | Ming Thong | Complete handover, demo script, limitations, evidence index, and final submission against the confirmed deadline. | [QU-07](features.md#qu-07) | T087 |

## Delivery risks and dependencies

| Risk | Accountable owner | Affected tasks | Control |
|---|---|---|---|
| Schedule and team capacity | Ming Thong | Entire schedule | Weekly completion gates and four-week planning blocks for M4–M6 |
| Shared data inconsistencies | Shee Yang | T004, T006–T012, T028 | Common domain contracts, units, and reference fixtures |
| Incorrect financial or emissions results | Elijah | T003, T009, T018, T022, T033 | Independent numerical examples and boundary tests |
| Persistence failures across environments | Brandon | T017, T026, T050, T077–T083 | Atomic saves, migration tests, and clean-environment verification |
| Freeform geometry complexity | Wei Jun | T023, T028, T048–T060 | Early prototype; separate geometry, viewport, and interface ownership |
| UI/viewport integration workload | Shee Yang | T042–T044, T051–T060, T069–T074 | Explicit dependencies, shared fixtures, and integrated acceptance gates |
| Platform compatibility | Shee Yang | T064, T079–T083 | Windows, Ubuntu, and macOS verification assigned to named owners |
| Rendering and recalculation performance | Ming Thong | T063, T067–T074 | Defined workload and numeric acceptance budgets |
| Asset dimensions or licensing | Jarrel | T007, T049, T068, T082 | Footprint checks and documented asset provenance |

## Main dependency paths

- **M1 integration:** T002/T003 → T004 → T009/T010 → T012; T007 → T011 → T013; both converge at T014 → T015.
- **Persistence:** T008 → T017 → T025/T026 → T031; T028/T037 → T050 → T056/T058.
- **Comparison:** T036 → T041 → T042; T040/T041 → T043; both converge at T044.
- **Freeform editor:** T023 → T028 → T048 → T051 → T054 → T055/T056 → T057 → T059 → T060.
- **Final release:** T074 → domain/geometry/persistence audits → platform checks → T083 → T084 → T087 → T088.

T074 covers feature completeness, T084 final acceptance, and T088 handover. The [acceptance matrix](tech/verification.md#feature-to-test-traceability) links every feature to its responsible task and verification criteria.
