# M1 technical deliverables

These are the technical deliverables proposed for the M1 contract. Each item is a component/system/library the team builds and owns; Jira stories and smaller integration work sit underneath these deliverables.

| ID | Technical deliverable | Owner | Supports |
|---|---|---|---|
| [T01](./T01%20-%20Project%20Persistence%20and%20Serialization%20Library.md) | Project Persistence & Serialization Library | Chew Shee Yang | F01, F02, F03, F04 |
| [T02](./T02%20-%20Company%20Design%20System%20and%20UI%20Component%20Library.md) | Company Design System & UI Component Library | Dayton Ng Zhi Jie | F01-F07 |
| [T03](./T03%20-%20Fleet%20and%20Scenario%20Data%20Engine.md) | Fleet & Scenario Data Engine | Tan Wei Jun | F01, F02, F03, F04, F05, F07 |
| [T04](./T04%20-%20Timeline%20and%20Scenario%20Playback%20System.md) | Timeline & Scenario Playback System | Jarrel Tay Wee Han | F04, F05, F07 |
| [T05](./T05%20-%20Simulation%20and%20Financial%20Engine.md) | Simulation & Financial Engine | Elijah Chua Jye Kang | F04, F06, F07 |
| [T06](./T06%20-%20Project%20and%20Scenario%20Workspace%20Orchestration%20System.md) | Project & Scenario Workspace Orchestration System | Brandon Koh Kai Yang | F03, F04 |
| [T07](./T07%20-%20Analytics%20Results%20and%20Visualization%20System.md) | Analytics Results & Visualization System | Yap Zhi Kai | F06, F07 |

## Supporting M1 technical work

These are required engineering tasks but are not separate Txx deliverables:

- **Scenario/domain contracts** — part of T03; Tan Wei Jun is primary owner, with Chew Shee Yang reviewing persistence-facing contracts.
- **CI pipeline** — Chew Shee Yang; automated install/typecheck/tests/build on the integration branch/PR workflow.
- **M1 end-to-end integration** — shared responsibility across T01-T07.
- **Automated engine/integration tests** — owned with the relevant Txx and exercised in the end-to-end M1 path.

## M1 integration target

The seven deliverables must operate as one system:

`Project/workspace -> real fleet/scenario data -> transition/settings -> deterministic simulation -> real analytics -> selected-year playback/3D -> save/reopen`
