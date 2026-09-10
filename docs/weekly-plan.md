# Weekly delivery plan and ownership

This is the working task schedule for all 55 committed features in the [feature inventory](features.md). It replaces the initial three-milestone schedule. Tasks are planned, not completed; prerequisite IDs identify dependencies, not verified current failures. Document task IDs are not Jira issue keys.

Implementation specifications: [contracts](contracts.md), [calculations](simulation.md), [editor behavior](design/depot-editor.md), [acceptance criteria](verification.md), and [engineering workflow](engineering-workflow.md). These define the engineering baseline; writing the specifications does not complete the implementation/review tasks below.

## Scheduling assumptions

- All dates are in 2026 and Singapore time. W01 starts on 10 September, the planning date, and is a short week. Subsequent dated weeks run Monday–Sunday.
- A row is due by the end of its listed week. M1 closes 4 October at 23:59; M2 closes 8 November at 23:59. M3 implementation closes 29 November; 30 November is the submission day and its official cutoff time is unspecified.
- M4, M5, and M6 each provisionally receive four active working weeks. These are capacity assumptions, not official dates, and do not imply uninterrupted work immediately after M3. Map them to the course calendar once dates and breaks are known.
- Named owners are accountable for implementation and relevant tests; reviewers and domain collaborators can help. This is a proposed allocation based on the team's roles, not a claim of agreed individual availability. Validate workload at weekly planning before treating it as a commitment.
- Rows specify completion weeks, not start dates. Investigations and designs intentionally precede integration. Same-week dependencies must finish in the listed order; a dependent task cannot be marked done before its prerequisites pass.
- Each implementation task includes relevant tests, documentation, review, and merge into the integrated application. A mock or contract can unblock development, but does not satisfy an integration acceptance criterion.
- Every week: Ming Thong checks scope and blockers; Shee Yang coordinates PR review and integration; all owners report completed evidence and emerging blockers. Unallocated time is for reviews, collaboration, and defects, not assumed spare capacity.

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

| Week / due | Task | Owner | Work and completion evidence | Features | Prerequisites |
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

| Week / due | Task | Owner | Work and completion evidence | Features | Prerequisites |
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

| Week / due | Task | Owner | Work and completion evidence | Features | Prerequisites |
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
| 30 Nov · submission only | T046 | Ming Thong | Submit the accepted M3 build and evidence; confirm official submission cutoff with the course. | [QU-07](features.md#qu-07) | T045 |

## M4 — freeform depot authoring (four provisional active weeks)

| Week / due | Task | Owner | Work and completion evidence | Features | Prerequisites |
|---|---|---|---|---|---|
| M4-W1 · date unassigned | T047 | Ming Thong | Finalize freeform editor flows, placement/error feedback, keyboard commands, and annotated wireframes. | [DE-01](features.md#de-01), [DE-02](features.md#de-02), [DE-03](features.md#de-03), [DE-05](features.md#de-05), [QU-01](features.md#qu-01) | T023, T035 |
| M4-W1 · date unassigned | T048 | Shee Yang | Implement/test pure polygon validity, containment, and overlap functions with agreed geometry conventions. | [DE-05](features.md#de-05) | T028 |
| M4-W1 · date unassigned | T049 | Jarrel | Deliver obstacle/depot assets and selectable footprints matched to actual bounds and units. | [DE-02](features.md#de-02), [VI-01](features.md#vi-01) | T024, T028 |
| M4-W1 · date unassigned | T050 | Brandon | Implement versioned layout persistence/duplication and migration round-trip tests. | [DE-07](features.md#de-07), [SC-03](features.md#sc-03) | T028, T037 |
| M4-W2 · date unassigned | T051 | Wei Jun | Implement site/obstacle polygon creation and vertex editing; display invalid polygon feedback. | [DE-01](features.md#de-01), [DE-02](features.md#de-02), [DE-05](features.md#de-05) | T047, T048, T049 |
| M4-W2 · date unassigned | T052 | Dayton | Implement layout object/property panel, dimensions, transform inputs, and edit commands against editor contracts. | [DE-03](features.md#de-03), [DE-04](features.md#de-04) | T028, T047 |
| M4-W2 · date unassigned | T053 | Zhi Kai | Implement stable vehicle-to-bay assignments and missing/duplicate/capacity validation with tests. | [FL-05](features.md#fl-05) | T027, T028 |
| M4-W3 · date unassigned | T054 | Wei Jun | Implement bay/charger add, move, rotate, duplicate, resize, delete, and snapping in the viewport. | [DE-03](features.md#de-03), [DE-04](features.md#de-04) | T051, T052 |
| M4-W3 · date unassigned | T055 | Shee Yang | Implement transaction-based layout history and cancel behavior using existing editor conventions. | [DE-06](features.md#de-06) | T048, T051, T054 |
| M4-W3 · date unassigned | T056 | Dayton | Connect bay assignments, placement conflict messages, and save/reopen/duplicate layout interactions. | [FL-05](features.md#fl-05), [DE-05](features.md#de-05), [DE-07](features.md#de-07) | T050, T052, T053, T054 |
| M4-W4 · date unassigned | T057 | Wei Jun | Verify full editing/undo flow and independent layouts in both 3D comparison scenes. | [DE-06](features.md#de-06), [DE-07](features.md#de-07), [VI-05](features.md#vi-05) | T043, T055, T056 |
| M4-W4 · date unassigned | T058 | Brandon | Verify saved layout/history boundaries, migration failures, and no cross-scenario layout mutation. | [SC-04](features.md#sc-04), [DE-07](features.md#de-07), [QU-05](features.md#qu-05) | T050, T056 |
| M4-W4 · date unassigned | T059 | Ming Thong | Run editor usability acceptance and record defects/evidence for all seven editor features. | [DE-01](features.md#de-01), [DE-02](features.md#de-02), [DE-03](features.md#de-03), [DE-04](features.md#de-04), [DE-05](features.md#de-05), [DE-06](features.md#de-06), [DE-07](features.md#de-07), [QU-01](features.md#qu-01) | T057, T058 |
| M4-W4 · date unassigned | T060 | Shee Yang | Resolve integration blockers and publish the accepted M4 build with geometry/browser evidence. | [QU-05](features.md#qu-05), [QU-07](features.md#qu-07) | T059 |

## M5 — complete features and harden interaction (four provisional active weeks)

| Week / due | Task | Owner | Work and completion evidence | Features | Prerequisites |
|---|---|---|---|---|---|
| M5-W1 · date unassigned | T061 | Elijah | Implement dwell-time, charger-availability, and installation-readiness checks with worked constraint cases. | [CH-06](features.md#ch-06) | T036, T041 |
| M5-W1 · date unassigned | T062 | Shee Yang | Translate layout conflicts and bay/charger shortages into scenario-level space feasibility results. | [CH-07](features.md#ch-07) | T048, T053, T060 |
| M5-W1 · date unassigned | T063 | Ming Thong | Confirm the documented reference workload and initial numeric budgets with technical owners against available hardware; record justified changes and the test environment. | [QU-04](features.md#qu-04) | T044, T060 |
| M5-W1 · date unassigned | T064 | Brandon | Verify local server/database setup and tests on Ubuntu 24.04; document prerequisites and recovery steps. | [QU-06](features.md#qu-06) | T058 |
| M5-W2 · date unassigned | T065 | Zhi Kai | Complete suitability scoring/reasons using charging access, dwell, timing, utilisation, and economics; test rankings. | [SU-01](features.md#su-01), [SU-02](features.md#su-02) | T038, T061, T062 |
| M5-W2 · date unassigned | T066 | Elijah | Implement assumption-impact explanations and reconcile plus/minus 20% price cases with reference results. | [SU-03](features.md#su-03), [FI-06](features.md#fi-06) | T041, T061 |
| M5-W2 · date unassigned | T067 | Wei Jun | Connect space/operational constraints to both scenes and profile interaction against the agreed workload. | [VI-04](features.md#vi-04), [CH-06](features.md#ch-06), [CH-07](features.md#ch-07), [QU-04](features.md#qu-04) | T057, T061, T062, T063 |
| M5-W2 · date unassigned | T068 | Jarrel | Finalize and optimize assets from profiling feedback; complete source/license documentation. | [VI-01](features.md#vi-01), [QU-04](features.md#qu-04), [QU-07](features.md#qu-07) | T049, T063, T067 |
| M5-W3 · date unassigned | T069 | Dayton | Integrate final rankings, impact explanations, and all feasibility warnings into both result views. | [SU-01](features.md#su-01), [SU-02](features.md#su-02), [SU-03](features.md#su-03), [CO-02](features.md#co-02), [CH-06](features.md#ch-06), [CH-07](features.md#ch-07) | T065, T066, T067 |
| M5-W3 · date unassigned | T070 | Shee Yang | Profile and improve repeated recalculation, state updates, and save integration; record budget results. | [FI-06](features.md#fi-06), [QU-04](features.md#qu-04) | T063, T066, T069 |
| M5-W3 · date unassigned | T071 | Ming Thong | Perform full usability/accessibility review; verify assumptions, emissions boundaries, labels, and failure messages. | [QU-01](features.md#qu-01), [QU-02](features.md#qu-02), [QU-03](features.md#qu-03) | T068, T069 |
| M5-W4 · date unassigned | T072 | Dayton | Resolve UI review defects and verify keyboard/empty/invalid/failure states across the product. | [SC-04](features.md#sc-04), [QU-01](features.md#qu-01), [QU-02](features.md#qu-02), [QU-03](features.md#qu-03) | T071 |
| M5-W4 · date unassigned | T073 | Wei Jun | Resolve remaining viewport performance/interaction defects; demonstrate measured dual-scene behavior. | [VI-02](features.md#vi-02), [VI-05](features.md#vi-05), [QU-04](features.md#qu-04) | T068, T070, T071 |
| M5-W4 · date unassigned | T074 | Shee Yang | Audit all 55 feature IDs against integrated evidence; publish the M5 feature-complete build and remaining defect list. | [QU-05](features.md#qu-05), [QU-07](features.md#qu-07) | T064, T072, T073 |

## M6 — final validation and handover (four provisional active weeks)

| Week / due | Task | Owner | Work and completion evidence | Features | Prerequisites |
|---|---|---|---|---|---|
| M6-W1 · date unassigned | T075 | Elijah | Independently audit cost, payback, energy, emissions, and assumption-impact cases; resolve numerical defects. | [FI-02](features.md#fi-02), [FI-03](features.md#fi-03), [FI-04](features.md#fi-04), [FI-05](features.md#fi-05), [EM-01](features.md#em-01), [EM-02](features.md#em-02), [SU-03](features.md#su-03), [QU-05](features.md#qu-05) | T074 |
| M6-W1 · date unassigned | T076 | Zhi Kai | Audit fleet CRUD, grouping, ordering, annual counts, assignments, and suitability edge cases. | [FL-01](features.md#fl-01), [FL-03](features.md#fl-03), [FL-05](features.md#fl-05), [TR-01](features.md#tr-01), [TR-02](features.md#tr-02), [TR-03](features.md#tr-03), [SU-01](features.md#su-01), [QU-05](features.md#qu-05) | T074 |
| M6-W1 · date unassigned | T077 | Brandon | Test empty/new/upgraded databases, round trips, and error recovery; fix persistence defects. | [SC-03](features.md#sc-03), [SC-04](features.md#sc-04), [DE-07](features.md#de-07), [QU-05](features.md#qu-05) | T074 |
| M6-W1 · date unassigned | T078 | Wei Jun | Run geometry/browser regression cases for invalid polygons, overlaps, edit cancellation, undo, and comparison isolation. | [DE-05](features.md#de-05), [DE-06](features.md#de-06), [DE-07](features.md#de-07), [VI-05](features.md#vi-05), [QU-05](features.md#qu-05) | T074 |
| M6-W2 · date unassigned | T079 | Shee Yang | Verify clean-clone install/typecheck/test/build on Windows 11 and integrate regression fixes. | [QU-05](features.md#qu-05), [QU-06](features.md#qu-06) | T075, T076, T077, T078 |
| M6-W2 · date unassigned | T080 | Brandon | Verify clean-clone setup/build and server tests on Ubuntu 24.04; capture exact environment evidence. | [QU-06](features.md#qu-06) | T064, T077 |
| M6-W2 · date unassigned | T081 | Dayton | Verify clean-clone setup/build on macOS Tahoe and browser workflows; record platform-specific fixes. | [QU-06](features.md#qu-06) | T072, T074 |
| M6-W2 · date unassigned | T082 | Jarrel | Audit shipped assets, attribution, dimensions, and demo scene completeness against the final build. | [VI-01](features.md#vi-01), [QU-07](features.md#qu-07) | T068, T078 |
| M6-W3 · date unassigned | T083 | Shee Yang | Integrate platform fixes and rerun affected checks; prepare release candidate with reproducible setup instructions. | [QU-05](features.md#qu-05), [QU-06](features.md#qu-06), [QU-07](features.md#qu-07) | T079, T080, T081, T082 |
| M6-W3 · date unassigned | T084 | Ming Thong | Run final user acceptance against the 55-feature matrix and original five scenarios; record defects and pass/fail evidence. | [QU-01](features.md#qu-01), [QU-03](features.md#qu-03), [QU-05](features.md#qu-05) | T083 |
| M6-W3 · date unassigned | T085 | Zhi Kai | Package the deterministic demo fleet/scenarios and reset instructions for the final walkthrough. | [SC-01](features.md#sc-01), [QU-03](features.md#qu-03), [QU-07](features.md#qu-07) | T076, T083 |
| M6-W4 · date unassigned | T086 | Dayton | Resolve final UI acceptance defects and verify affected interactions. | [QU-01](features.md#qu-01), [QU-02](features.md#qu-02) | T084 |
| M6-W4 · date unassigned | T087 | Shee Yang | Triage final technical defects to domain owners, integrate fixes, rerun affected checks, and tag the accepted release. | [QU-05](features.md#qu-05), [QU-06](features.md#qu-06), [QU-07](features.md#qu-07) | T084, T085, T086 |
| M6-W4 · date unassigned | T088 | Ming Thong | Complete handover, demo script, limitations, evidence index, and final submission against the confirmed deadline. | [QU-07](features.md#qu-07) | T087 |

## Blockers, risks, and escalation owners

These are known planning dependencies or risks. Their presence is not proof work is currently blocked. Record an actual blocker with discovery date, affected task IDs, owner, next action, and next review date in the weekly review.

| Blocker / risk | Owner | Affected tasks | Required action / resolution point |
|---|---|---|---|
| Individual weekly availability and other course workload are unknown | Ming Thong | Entire schedule | Confirm capacity before committing weekly work. Split oversized rows into Jira tasks while retaining the parent ID and acceptance outcome. |
| M4–M6 dates and available working weeks are unknown | Ming Thong | T047–T088 | Obtain the calendar by M3 review; map relative weeks and rebaseline if fewer than four weeks per milestone are available. Never silently compress testing. |
| M3 submission cutoff is unknown | Ming Thong | T046 | Confirm before M3 submission week; keep the accepted build ready by 29 November. |
| Shared interfaces/units not yet agreed | Shee Yang | T006, T008–T012, T028 | Complete T004 with Elijah, Zhi Kai, Brandon, and Wei Jun; publish versioned fixtures before integration. |
| Financial baseline and emissions boundaries need numerical agreement | Elijah | T009, T018, T022, T033 | Complete T003 reference cases; resolve ambiguity before implementing downstream formulas. |
| Local database setup or migrations may fail on clean machines | Brandon | T017, T025, T050, T077–T083 | Prove local setup and migration tests early; maintain reproducible configuration and safe templates. |
| Freeform geometry/edit history may exceed the allocated effort | Wei Jun | T048–T060 | Use T023 prototype and T028 review to expose complexity before M4; Shee Yang owns geometry functions/history so Wei Jun can focus on viewport tools. |
| Core UI and viewport integration concentrate on Dayton and Wei Jun | Shee Yang | T042–T044, T051–T060, T069–T074 | Review these weeks for capacity; arrange contributor help and early reviews, preserving one accountable owner per task. |
| Suitable macOS Tahoe, Windows 11, and Ubuntu 24.04 environments may be unavailable | Shee Yang | T064, T079–T083 | Confirm access during M1 setup and book machines before M5. Dayton owns macOS evidence, Brandon Ubuntu, Shee Yang Windows. |
| Initial performance budgets are specified but not yet measured on reference hardware | Ming Thong | T067–T074 | Confirm the workload and thresholds from the verification plan with Shee Yang/Wei Jun in T063 before judging performance acceptance. |
| Asset footprint/provenance mismatch | Jarrel | T011, T049, T068, T082 | Validate scale/bounds and licensing before asset integration; use simple temporary geometry only for development. |
| Jira project access, instructor repository access, and Excel sheet location are unverified | Ming Thong | Administrative handoff | Obtain Jira/Excel details; Shee Yang arranges repository publication and giraphics access with an administrator. These do not block local implementation. |

## Dependency paths and milestone gates

- **M1 integration:** T002/T003 → T004 → T009/T010 → T012; T007 → T011 → T013; both converge at T014 → T015.
- **Persistence:** T008 → T017 → T025/T026 → T031; geometry versioning T028 and T037 feed T050 → T056/T058.
- **Comparison:** T036 → T041 → T042; T040/T041 → T043; both converge at T044. Ready-made result fixtures can unblock UI development but cannot replace this integrated gate.
- **Freeform editor:** T023 → T028 → T048 → T051 → T054 → T055/T056 → T057 → T059 → T060.
- **Final release:** T074 → numerical/domain/persistence/geometry audits → platform checks → T083 → T084 → T087 → T088.

These are dependency paths, not a mathematically computed critical path: task duration estimates and actual team capacity have not yet been established. If a prerequisite misses its week, mark its dependent tasks at risk immediately and replan with the owner. Do not mark milestone acceptance complete solely because its date arrives.

## Definition of done and traceability

Each task requires its stated output, relevant tests or review evidence, and an integrated/reviewed result. Keep feature IDs on Jira Stories and task IDs in their descriptions/PRs. Track planned/in progress/blocked/done in Jira once available; this document defines the baseline schedule, not live status.

T074 audits feature completeness, T084 audits final acceptance, and T088 closes handover. Optional extensions from the feature inventory have no scheduled tasks and are not required for M6.
