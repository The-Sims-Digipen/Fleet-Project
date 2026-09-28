# Weekly technical delivery plan

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

# M1 implementation phase

The UI-stub phase is complete enough to move into the M1 integration phase. The priority is now to replace mock/hard-coded state in the core M1 path with shared domain state, deterministic calculations and persistent project data.

The versioned domain handoff, shared-file ownership and merge sequence are fixed in the [M1 integration contract](tech/m1-integration-contract.md). Implementation branches start from a verified commit containing that contract rather than from the earlier UI-stub branches.

## Product feature targets

- [F01 — Vehicle Presets](features/F01%20-%20Vehicle%20Presets.md) — MUST — Tan Wei Jun
- [F02 — Fleet Management](features/F02%20-%20Fleet%20Management.md) — MUST — Jarrel Tay Wee Han
- [F03 — Project & Scenario Management](features/F03%20-%20Project%20and%20Scenario%20Management.md) — MUST — Brandon Koh Kai Yang
- [F04 — Transition & Simulation Settings](features/F04%20-%20Transition%20and%20Simulation%20Settings.md) — MUST — Elijah Chua Jye Kang
- [F05 — 3D Fleet Visualisation & Inspection](features/F05%20-%203D%20Fleet%20Visualisation%20and%20Inspection.md) — MUST — Chew Shee Yang
- [F06 — Financial & Payback Results](features/F06%20-%20Financial%20and%20Payback%20Results.md) — MUST — Yap Zhi Kai
- [F07 — Timeline Control](features/F07%20-%20Timeline%20Control.md) — MUST — Jarrel Tay Wee Han
- [F08 — Power & Feasibility Information](features/F08%20-%20Power%20and%20Feasibility%20Information.md) — SHOULD — Dayton Ng Zhi Jie

## M1 technical deliverables

- [T01 — Project Persistence & Serialization Library](tech-tasks/T01%20-%20Project%20Persistence%20and%20Serialization%20Library.md) — Chew Shee Yang
- [T02 — Company Design System & UI Component Library](tech-tasks/T02%20-%20Company%20Design%20System%20and%20UI%20Component%20Library.md) — Dayton Ng Zhi Jie
- [T03 — Fleet & Scenario Data Engine](tech-tasks/T03%20-%20Fleet%20and%20Scenario%20Data%20Engine.md) — Tan Wei Jun
- [T04 — Timeline & Scenario Playback System](tech-tasks/T04%20-%20Timeline%20and%20Scenario%20Playback%20System.md) — Jarrel Tay Wee Han
- [T05 — Simulation & Financial Engine](tech-tasks/T05%20-%20Simulation%20and%20Financial%20Engine.md) — Elijah Chua Jye Kang
- [T06 — Project & Scenario Workspace Orchestration System](tech-tasks/T06%20-%20Project%20and%20Scenario%20Workspace%20Orchestration%20System.md) — Brandon Koh Kai Yang
- [T07 — Analytics Results & Visualization System](tech-tasks/T07%20-%20Analytics%20Results%20and%20Visualization%20System.md) — Yap Zhi Kai

## Integration order

1. Lock T03 domain contracts and T06 workspace boundaries; T01 reviews serialization-facing types.
2. Replace mock fleet/scenario state with T03 and ensure T01 can save/reopen it.
3. Implement T05 as a pure deterministic engine using T03 inputs.
4. Connect T07 to T05 outputs and remove hard-coded primary financial results.
5. Connect T04 to real scenario transition events and one authoritative selected year.
6. Drive F05 3D state from T03 + T04 rather than independent transition logic.
7. Exercise the full M1 path and keep CI green.

## Supporting technical work

- **Scenario/domain contracts:** part of T03; Tan Wei Jun primary, Chew Shee Yang reviews persistence-facing contracts.
- **CI pipeline:** Chew Shee Yang; install/typecheck/tests/build on PR/integration branch.
- **M1 smoke path:** create/open -> preset/fleet edit -> scenario transition -> simulation -> real analytics -> selected-year 3D -> save/reopen.
- **Tests:** each engine owns unit tests; cross-system behavior gets integration coverage before M1 submission.
