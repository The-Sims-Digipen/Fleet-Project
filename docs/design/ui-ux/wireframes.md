# Workspace wireframes and flows

Design reference: 10 September 2026. WF01–WF05 describe the interface layout and interaction states. They specify information hierarchy rather than final visual styling.

## WF01 — project home (F07, F08)

```text
Fleet Transition Planner                              Simulation
[New project] [Open synthetic example]

Saved projects
Name                  Updated                  Actions
Depot transition      10 Sep 2026              [Open] [Delete]

Empty: No saved projects. Create a fleet or open an example.
Error: Projects could not be loaded. [Retry]  Your open edits are retained.
```

New/sample projects begin unsaved. Delete shows the project name and requires confirmation. Home does not require a login.

## WF02 — planning workspace (F02–F04)

```text
Project: Depot transition   Scenario: Plan A v   Unsaved changes [Save]
SIMULATION · Illustrative inputs                 [Plan] [Depot] [Compare]
[Fleet & analysis: applies to all plans] [Duplicate scenario]
+-----------------------+-------------------------------+--------------------+
| Fleet                 | 3D depot                      | Selected vehicle   |
| Filter / sort         | Orbit · Pan · Zoom · Reset    | ID, type, age      |
| [ ] A   Van-A -> EV-A 2027 |                               | Transition year    |
| [ ] B   Van-B -> EV-B 2028 | Selected object highlighted   | Range / operation  |
| [Add] [Edit] [Remove]  |                               | [Apply to selected]|
| Selected: 2           |                               | Charging settings  |
+-----------------------+-------------------------------+--------------------+
| Year: [2026 <------o--------------------> 2029]  2027 v                  |
| Current 1 · Transitioned 1 · Demand 7 kW / Limit 6 kW · OVERLOAD: 1 kW                 |
+------------------------------------------------------------------------+
| TCO | CAPEX | Annual OPEX | Savings vs baseline | Emissions | Payback          |
| [Costs] [Emissions] [Roadmap] [Suitability] [Assumptions & limits]         |
| Chart plus labeled values; infeasibility warning remains visible        |
+------------------------------------------------------------------------+
```

An invalid draft leaves results labeled “Last valid inputs.” Shared settings label their effect on both plans. Charts use full-period data and selected-year markers.

## WF03 — depot authoring (F13–F16)

```text
Plan A · Depot                                     Unsaved [Save]
[Select] [Site] [Obstacle] [Bay] [Charger] [Undo] [Redo]
+----------------------+--------------------------------+-------------------+
| Objects              | Ground plane and grid          | Properties        |
| Site                 | Selected footprint/vertices    | X / Z metres      |
| Obstacle 1           | Valid preview or issue outline | Width / Depth     |
| Bay 1 -> Vehicle A   |                                | Rotation degrees  |
| Charger 1 -> 2027    | Future charger: ghost + year   | Installation year |
| Unassigned vehicles  |                                | Power / costs     |
+----------------------+--------------------------------+-------------------+
| Grid: 0.25 m [Snap]   Rotation: 15 deg [Snap]   [Finish] [Cancel]          |
| Issues: Bay 1 overlaps Obstacle 1 [Select objects]                        |
+------------------------------------------------------------------------+
```

Numeric controls and the object list supplement viewport tools. Invalid rings show outlines without attempting filled triangulation. Costs remain indicative while layout issues exist.

## WF04 — comparison (F10, F12)

```text
Compare · Same project fleet and analysis · Baseline TCO: ...
Shared year: 2027 v                         [Return to Plan]
+-----------------------------------+------------------------------------+
| Plan A v                 [Edit A] | Plan B v                  [Edit B] |
| Independent depot scene          | Independent depot scene            |
| Preset counts · demand/limit     | Preset counts · demand/limit       |
| TCO · CAPEX · OPEX · payback      | TCO · CAPEX · OPEX · payback        |
| Emissions · feasibility issues   | Emissions · feasibility issues     |
+-----------------------------------+------------------------------------+
| B minus A: cost ... / emissions ... / transition count ...               |
| Full-horizon comparison chart + values + terminal-credit explanation     |
+------------------------------------------------------------------------+
```

Selecting a year changes both scenes/results; camera navigation remains independent. One-scenario projects offer duplication instead of an empty second column.

## WF05 — saving and conflict recovery (F07, F08, F19)

```text
Save failed: Your edits are still available. [Retry]

Newer project revision found in another tab.
[Keep editing] [Reload saved version...] [Save as new project]
Reload confirmation: Unsaved changes will be discarded. [Cancel] [Discard]
```

Do not display successful save state until the server acknowledges the captured revision. If editing continued during the request, display unsaved changes for the newer snapshot.
