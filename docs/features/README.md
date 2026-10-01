# Current M1 features

The accepted M1 scope describes the implemented product.
F01–F07 form its feature scope.
The individual documents describe available controls, behavior and demonstrations.

Project document format version 1 stores one Project environment and its Scenarios.
Scenarios own ordered Vehicle Plans.
They share the fleet, Presets and Analysis Settings.

| ID | Feature | M1 priority | Primary feature owner |
|---|---|---|---|
| [F01](./F01%20-%20Vehicle%20Presets.md) | Vehicle Presets | MUST | Tan Wei Jun |
| [F02](./F02%20-%20Fleet%20Management.md) | Fleet Management | MUST | Jarrel Tay Wee Han |
| [F03](./F03%20-%20Project%20and%20Scenario%20Management.md) | Project & Scenario Management | MUST | Brandon Koh Kai Yang |
| [F04](./F04%20-%20Transition%20and%20Simulation%20Settings.md) | Transition & Simulation Settings | MUST | Elijah Chua Jye Kang |
| [F05](./F05%20-%203D%20Fleet%20Visualisation%20and%20Inspection.md) | 3D Fleet Visualisation & Inspection | MUST | Chew Shee Yang |
| [F06](./F06%20-%20Financial%20and%20Payback%20Results.md) | Financial & Payback Results | MUST | Yap Zhi Kai |
| [F07](./F07%20-%20Timeline%20Control.md) | Timeline Control | MUST | Jarrel Tay Wee Han |

## M1 workflow

1. Create, open or import a Project.
2. Create or edit a Vehicle Preset.
3. Add or select a Vehicle.
4. Edit its baseline Preset and inputs.
5. Create or select a Scenario.
6. Assign a target Preset.
7. Assign a transition year.
8. Inspect calculated results.
9. Change the selected year.
10. Inspect fleet and 3D state.
11. Save the Project.
12. Reload the application.
13. Reopen the Project.

The current interface does not expose an Open sample command.
Synthetic fleet examples are test fixtures.

## Compare

Compare displays two Scenarios over the same Project environment.
It includes dual 3D views, selected-year metrics, B-minus-A differences, a cumulative cash-cost chart and annual transition counts.

## F08 panel status

[F08 — Power & Feasibility Information](./F08%20-%20Power%20and%20Feasibility%20Information.md) belongs to Dayton Ng Zhi Jie.
Its current panel displays an informational note only.
It does not calculate demand, capacity or feasibility.
F08 is excluded from the completed M1 feature scope.
