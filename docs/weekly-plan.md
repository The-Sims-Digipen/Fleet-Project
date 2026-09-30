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

## Integration order

1. Lock domain contracts and workspace boundaries; the Technical Lead reviews serialization-facing types.
2. Replace mock fleet/scenario state and ensure the aggregate can be saved and reopened.
3. Implement the simulation as a pure deterministic engine using canonical Project inputs.
4. Connect analytics views to simulation outputs and remove hard-coded primary financial results.
5. Connect timeline controls to real Scenario transition events and workspace-scoped runtime state.
6. Drive F05 3D state from the canonical Project and Plan timeline rather than independent transition logic.
7. Exercise the full M1 path and keep CI green.

## Supporting technical work

- **Scenario/domain contracts:** Tan Wei Jun primary; Chew Shee Yang reviews persistence-facing contracts.
- **CI pipeline:** Chew Shee Yang; install/typecheck/tests/build on PR/integration branch.
- **M1 smoke path:** create/open -> preset/fleet edit -> scenario transition -> simulation -> real analytics -> selected-year 3D -> save/reopen.
- **Tests:** each engine owns unit tests; cross-system behavior gets integration coverage before M1 submission.
