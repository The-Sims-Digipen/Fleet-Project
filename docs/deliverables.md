# Deliverables and ownership

The [weekly delivery plan](weekly-plan.md) is the authoritative task allocation and schedule for M1–M6. It replaces the initial M1–M3-only targets. The [feature inventory](features.md) defines the final application scope; final acceptance is at M6.

## Technical deliverables / Jira Epics

Each row is an Epic-ready workstream. Weekly task IDs are document identifiers, not created Jira issues. Integration tasks may reference features across multiple workstreams; the task table names one accountable owner for each task.

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

Suitability ownership is split deliberately: Zhi Kai owns ranking and vehicle reason codes; Elijah provides economic and charging inputs. Geometry ownership is also explicit: Shee Yang owns pure validation and history integration; Wei Jun owns viewport authoring; Dayton owns DOM panels; Jarrel owns asset footprints.

## Milestone dates and gates

| Milestone | Deadline / scheduling basis | Gate |
|---|---|---|
| M1 | 4 October 2026, 23:59 Singapore time | Sample fleet → transition edit → cost result → updated depot. |
| M2 | 8 November 2026, 23:59 Singapore time | Editable fleet/plans, financial/emissions results, and reliable save/load. |
| M3 | 30 November 2026; official cutoff unspecified | Charging and power feedback, two-plan comparison, initial suitability. Build ready by 29 November. |
| M4 | Date undecided; four provisional active weeks | Integrated freeform depot editing, validation, history, and layout persistence. |
| M5 | Date undecided; four provisional active weeks | All features integrated, final constraint/ranking explanations, usability and performance work. |
| M6 | Date undecided; four provisional active weeks | Final numerical/domain/browser/platform acceptance and handover. |

The weekly plan records dependencies, completion evidence, risks, and owners. Relative weeks must be mapped to actual dates once the remaining course schedule is known. Do not interpret the four-week allocation as confirmed course duration.

## Jira, PRs, and engineering evidence

Create the Epics above and the 88 tasks in the weekly plan in the team's Jira project when access is available. Preserve task/feature IDs and predecessor relationships. Add actual Jira links only after creation. Split work into smaller implementation tasks as needed without dropping acceptance criteria or changing accountability silently.

Reference Jira work in PRs, attach relevant test/review evidence, and update documentation with contract changes. GitHub holds implementation and evidence; Jira holds live task status. CI begins at M1, and testing accompanies each implementation task rather than being deferred to M6.

## Outstanding handoff steps

- Ooi Ming Thong: confirm scope against the submitted proposal and any sponsor/course feedback; keep the final feature inventory synchronized.
- Ooi Ming Thong: obtain Jira project details, the Excel sheet location/fields, M3 cutoff, and M4–M6 dates; coordinate the corresponding updates and record completion.
- Chew Shee Yang: review/publish repository changes through the team's PR process and arrange collaborator access for `giraphics` with a repository administrator; verify access rather than assuming an invitation succeeded.
- All owners: confirm weekly capacity and record evidence for completed tasks. Platform verification owners are specified in the weekly plan.

External Jira creation, Excel updates, repository publication, and collaborator access have not been performed or verified by this documentation change.
