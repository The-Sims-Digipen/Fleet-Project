# Team roles and M1 deliverables

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

## Accepted M1 scope

The accepted M1 scope describes the implemented product.
F01–F07 form its feature scope.

| ID | Feature | Priority |
|---|---|---|
| F01 | Vehicle Presets | MUST |
| F02 | Fleet Management | MUST |
| F03 | Project & Scenario Management | MUST |
| F04 | Transition & Simulation Settings | MUST |
| F05 | 3D Fleet Visualisation & Inspection | MUST |
| F06 | Financial & Payback Results | MUST |
| F07 | Timeline Control | MUST |

The [feature catalogue](features/README.md) defines current behavior and ownership.
Each Project owns one physical environment.
Its Scenarios own Vehicle Plans over the shared fleet.
Current Compare views use the same environment and assumptions.

F08 identifies the informational Charging & feasibility panel.
It is excluded from the completed M1 feature scope.
The panel does not calculate demand, capacity or feasibility.

## Supporting technical work

| Work | Current ownership |
|---|---|
| Scenario/domain contracts | Tan Wei Jun is the primary owner. Chew Shee Yang reviews contracts that affect persistence. |
| CI pipeline | Chew Shee Yang |
| M1 integration and integration tests | Shared team responsibility |

The [M1 integration contract](tech/m1-integration-contract.md) defines shared boundaries and the merge gate.
CI remains a fixed rubric requirement.

## M1 workflow

1. Create, open or import a Project.
2. Edit a Vehicle Preset.
3. Edit the fleet.
4. Set a Scenario transition.
5. Inspect calculated results.
6. Change the selected year.
7. Inspect the 3D fleet state.
8. Save the Project.
9. Reopen the Project.

## M1 deadline

M1 is due on 4 October 2026 at 23:59 Singapore time.
