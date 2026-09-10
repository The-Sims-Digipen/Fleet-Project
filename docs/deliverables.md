# Deliverables and ownership

The project is delivered across M1–M6, with final acceptance at M6. The [feature inventory](features.md) defines scope, and the [weekly plan](weekly-plan.md) assigns each task, completion week, and dependency.

## Technical deliverables

Each workstream maps to a Jira Epic. Individual task ownership and acceptance evidence appear in the weekly plan.

| Deliverable / Epic title | Accountable owner | Responsibility |
|---|---|---|
| Product and UX design | Ooi Ming Thong | Product flows, annotated designs, usability/acceptance reviews, milestone submissions, and scope/capacity coordination. |
| Architecture and integration | Chew Shee Yang | Shared contracts, CI/PR integration, geometry validation/history support, performance integration, and release/platform evidence. |
| Web interface | Dayton Ng Zhi Jie | Fleet/scenario forms, results/charts, comparison controls, editor panels, accessibility, and macOS verification. |
| 3D assets | Jarrel Tay Wee Han | Depot/vehicle/charger/obstacle assets, scale/bounds, optimization, and provenance. |
| Simulation engine | Elijah Chua Jye Kang | Financial/energy/emissions calculations, charging feasibility, payback, impact explanations, and numerical validation. |
| 3D systems and visualization | Tan Wei Jun | Scene rendering, selection, timelines, freeform viewport tools, overlays, dual scenes, and browser verification. |
| Vehicle systems | Yap Zhi Kai | Fleet domain/fixtures, schedules/groups, annual counts, bay assignment, suitability rules, and domain testing. |
| Backend | Brandon Koh Kai Yang | Local PostgreSQL schema/migrations, fleet/scenario/layout persistence, failure handling, and Ubuntu verification. |


## Milestone gates

| Milestone | Deadline / scheduling basis | Gate |
|---|---|---|
| M1 | 4 October 2026, 23:59 Singapore time | Sample fleet → transition edit → cost result → updated depot. |
| M2 | 8 November 2026, 23:59 Singapore time | Editable fleet/plans, financial/emissions results, and reliable save/load. |
| M3 | 30 November 2026 | Charging and power feedback, two-plan comparison, initial suitability. Build ready by 29 November. |
| M4 | Relative weeks 1–4 | Integrated freeform depot editing, validation, history, and layout persistence. |
| M5 | Relative weeks 1–4 | All features integrated, final constraint/ranking explanations, usability and performance work. |
| M6 | Relative weeks 1–4 | Final numerical/domain/browser/platform acceptance and handover. |


M1–M3 dates are in Singapore time. M4–M6 use four-week planning blocks; their calendar dates are not set.

## Accountability and evidence

Zhi Kai owns suitability rankings, supported by Elijah's economic and charging calculations. Shee Yang owns geometry validation/history integration, Wei Jun viewport tools, Dayton interface panels, and Jarrel asset footprints.

GitHub contains source, design, tests, and review evidence. Jira tracks delivery work. Each task is complete when its output meets the stated criteria, relevant checks pass, and the result is integrated and reviewed. CI and testing accompany development from M1 through M6.
