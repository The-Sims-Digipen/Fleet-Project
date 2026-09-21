# Product features

These are the product features currently tracked for the Fleet Transition Planner. The M1 contract proposal treats F01-F07 as **MUST** features; F08 is a **SHOULD** feature and is not required for the M1 core flow.

| ID | Feature | M1 priority | Primary feature owner |
|---|---|---|---|
| [F01](./F01%20-%20Vehicle%20Presets.md) | Vehicle Presets | MUST | Tan Wei Jun |
| [F02](./F02%20-%20Fleet%20Management.md) | Fleet Management | MUST | Jarrel Tay Wee Han |
| [F03](./F03%20-%20Project%20and%20Scenario%20Management.md) | Project & Scenario Management | MUST | Brandon Koh Kai Yang |
| [F04](./F04%20-%20Transition%20and%20Simulation%20Settings.md) | Transition & Simulation Settings | MUST | Elijah Chua Jye Kang |
| [F05](./F05%20-%203D%20Fleet%20Visualisation%20and%20Inspection.md) | 3D Fleet Visualisation & Inspection | MUST | Chew Shee Yang |
| [F06](./F06%20-%20Financial%20and%20Payback%20Results.md) | Financial & Payback Results | MUST | Yap Zhi Kai |
| [F07](./F07%20-%20Timeline%20Control.md) | Timeline Control | MUST | Jarrel Tay Wee Han |
| [F08](./F08%20-%20Power%20and%20Feasibility%20Information.md) | Power & Feasibility Information | SHOULD | Dayton Ng Zhi Jie |

## M1 end-to-end flow

The MUST features should combine into one demonstrable workflow:

1. Create or open a project.
2. Create/edit a vehicle preset and fleet vehicle.
3. Create/select a scenario and assign a target preset and transition year.
4. Recalculate financial/payback results from real inputs.
5. Change the selected year and show the fleet/3D state update consistently.
6. Save the project, reload/reopen it, and restore the authoritative project/scenario state.

F08 remains useful product scope, but the full charging/power feasibility engine is intentionally deferred beyond the M1 MUST contract.
