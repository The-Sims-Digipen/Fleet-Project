# M1 technical delivery

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

## Current implementation

F01–F07 form the accepted M1 scope.
They use shared Project state, a custom calculation engine and complete-Project persistence.
Each Project owns one physical environment.
Each Scenario owns Vehicle Plans over that environment.

The [M1 integration contract](tech/m1-integration-contract.md) defines domain boundaries and the merge gate.
Implementation branches use a verified commit that contains this contract.

## Feature ownership

- [F01 — Vehicle Presets](features/F01%20-%20Vehicle%20Presets.md) — MUST — Tan Wei Jun
- [F02 — Fleet Management](features/F02%20-%20Fleet%20Management.md) — MUST — Jarrel Tay Wee Han
- [F03 — Project & Scenario Management](features/F03%20-%20Project%20and%20Scenario%20Management.md) — MUST — Brandon Koh Kai Yang
- [F04 — Transition & Simulation Settings](features/F04%20-%20Transition%20and%20Simulation%20Settings.md) — MUST — Elijah Chua Jye Kang
- [F05 — 3D Fleet Visualisation & Inspection](features/F05%20-%203D%20Fleet%20Visualisation%20and%20Inspection.md) — MUST — Chew Shee Yang
- [F06 — Financial & Payback Results](features/F06%20-%20Financial%20and%20Payback%20Results.md) — MUST — Yap Zhi Kai
- [F07 — Timeline Control](features/F07%20-%20Timeline%20Control.md) — MUST — Jarrel Tay Wee Han

[F08 — Power & Feasibility Information](features/F08%20-%20Power%20and%20Feasibility%20Information.md) belongs to Dayton Ng Zhi Jie.
Its current panel contains an informational note.
F08 is excluded from the completed M1 feature scope.

## Current integration path

Project commands change the canonical Project document.
The custom simulation derives baseline and Scenario results from that document.
Analytics display those results.
Timeline controls set each workspace's selected year.
The 3D view derives the effective fleet from the same Project and selected year.
The repository saves and reopens the complete Project.

Plan and Compare retain separate selected years and playback state.
Both Compare columns use the Compare selected year.

## Supporting technical work

| Work | Owner or current behavior |
|---|---|
| Scenario/domain contracts | Tan Wei Jun is the primary owner. Chew Shee Yang reviews contracts that affect persistence. |
| CI pipeline | Chew Shee Yang. CI installs dependencies, checks types, runs tests and builds on PRs and integration branches. |
| M1 workflow | New/open/import Project → Preset/fleet edit → Scenario transition → simulation → analytics → selected-year 3D state → save/reopen |
| Tests | Engine owners maintain unit tests. Integration tests cover cross-system behavior. |

The feature catalogue remains the implementation hierarchy.
