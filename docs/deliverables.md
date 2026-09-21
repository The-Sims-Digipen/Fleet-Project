# Team roles and milestone deliverables

## Team roles

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

## M1 contract proposal

The team has internally locked the following M1 proposal. It becomes the formal M1 contract once approved by the instructor.

### Product features

| ID | Feature | Priority |
|---|---|---|
| F01 | Vehicle Presets | MUST |
| F02 | Fleet Management | MUST |
| F03 | Project & Scenario Management | MUST |
| F04 | Transition & Simulation Settings | MUST |
| F05 | 3D Fleet Visualisation & Inspection | MUST |
| F06 | Financial & Payback Results | MUST |
| F07 | Timeline Control | MUST |
| F08 | Power & Feasibility Information | SHOULD |

See [features/README.md](features/README.md) for detailed scope and ownership.

### Technical deliverables

| ID | Technical deliverable | Owner |
|---|---|---|
| T01 | Project Persistence & Serialization Library | Chew Shee Yang |
| T02 | Company Design System & UI Component Library | Dayton Ng Zhi Jie |
| T03 | Fleet & Scenario Data Engine | Tan Wei Jun |
| T04 | Timeline & Scenario Playback System | Jarrel Tay Wee Han |
| T05 | Simulation & Financial Engine | Elijah Chua Jye Kang |
| T06 | Project & Scenario Workspace Orchestration System | Brandon Koh Kai Yang |
| T07 | Analytics Results & Visualization System | Yap Zhi Kai |

See [tech-tasks/README.md](tech-tasks/README.md) for detailed scope, dependencies and M1 evidence.

### Supporting M1 technical work

- Scenario/domain contracts are part of T03, with persistence-facing review by T01's owner.
- CI pipeline is owned by Chew Shee Yang and remains a fixed rubric requirement rather than a separate Txx.
- End-to-end M1 integration and automated integration testing are shared responsibilities.

## Milestone gates

| Milestone | Deadline / scheduling basis | Required implementation state |
|---|---|---|
| M1 | 4 October 2026, 23:59 Singapore time | Sample/new project -> real preset/fleet edit -> generic scenario transition -> deterministic recalculated result -> selected-year 3D update -> save/reopen. |
| M2 | 8 November 2026, 23:59 Singapore time | Full fleet/preset planning, financial/energy/emissions analytics, project/scenario workflow, and reliable persistence; later technical deliverables are reorganized from approved M2 product requirements. |
| M3 (MVP) | 30 November 2026 | Charging/feasibility, suitability recommendations, and two-scenario comparison including dual 3D scenes. Build ready by 29 November. |
| M4 | Relative weeks 1-4 | Freeform depot authoring, geometry validation/history, assignments, shared world layout persistence, and comparison integration. |
| M5 | Relative weeks 1-4 | All product features integrated with shared feasibility/recommendation state, responsive/error hardening, and performance optimization. |
| M6 | Relative weeks 1-4 | Full regression, clean-environment/platform verification, final performance measurements, and release build. |

M2/M3 Txx numbering is intentionally not locked here; later technical deliverables should be derived from the approved feature requirements and architecture for those milestones rather than from a fixed quota.
