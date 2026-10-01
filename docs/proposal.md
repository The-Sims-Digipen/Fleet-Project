# Fleet Transition Planner — product definition

## Problem, audience, and outcome

Fleet operators need to compare Vehicle replacement choices.
They need to see how the target Preset and transition year affect costs, energy use, emissions and payback.

The current product provides editable fleet inputs, Scenario plans, calculated results and a 3D Depot view.
Users can save and reopen one Project with independent Scenarios.

## Accepted M1 scope

The accepted M1 scope consists of the current implementation.
F01–F07 describe its implemented features.
The [feature catalogue](features/README.md) identifies their owners.

Each Project owns one physical environment, one Depot, Vehicle baselines, Vehicle Presets, shared Analysis Settings and its Scenarios.
Scenarios contain ordered Vehicle Plans.
They share the same fleet and assumptions.

The workflow starts with a new, saved or imported Project.
Users edit Presets and Vehicles, set transitions, inspect results, select a year, and save/reopen the Project.
Compare displays two Scenarios over the same Project environment.

## Platform and data

The product runs in a browser.
React, TypeScript, Vite and Tailwind CSS provide the interface.
Three.js and React Three Fiber provide 3D views.
Zustand holds application and Project state.
ECharts displays cost charts.

The browser saves complete Projects to IndexedDB.
The current save workflow does not depend on the Fastify/PostgreSQL server.
A `.fleetproject` file transfers Project data between browsers.

A new Project has an empty fleet, five synthetic Vehicle Presets and Plan A.
Its default analysis period is 2026–2035 inclusive, with SGD as the currency.
Synthetic fleet examples are test fixtures.
The interface does not expose an Open sample command.

The Project limit is ten Vehicles.
New Vehicles receive world transforms from ten predefined positions.
The Project stores Vehicle transforms, not a spawn-position list or parking assignments.

## Current capabilities

| Feature | Implemented behavior |
|---|---|
| F01 — Vehicle Presets | Create, duplicate and edit Presets. Delete unused Presets. Select the registered Vehicle model. |
| F02 — Fleet Management | Add, select, edit and delete individual Vehicles. Preserve their IDs, baseline Presets and Project-owned transforms. |
| F03 — Project & Scenario Management | Create, open, import, export and save Projects. Create, select, rename, duplicate and remove Scenarios. |
| F04 — Transition & Simulation Settings | Set the selected Vehicle's first target/year. Edit shared assumptions. Preserve and calculate complete ordered Vehicle Plans. |
| F05 — 3D Fleet Visualisation & Inspection | View the Depot and selected-year fleet. Navigate the camera. Select and highlight Vehicles. |
| F06 — Financial & Payback Results | Display costs, payback, energy, emissions, charts and annual tables from the custom simulation engine. |
| F07 — Timeline Control | Select a year. Play, pause and reset the timeline. Display transition events. Synchronize dependent views. |

The current model selector offers Low-poly Van.
The fleet form edits one Vehicle at a time.
The transition form edits the first transition.
Imported plans can contain later transitions.

Compare includes dual 3D views, calculated metrics, B-minus-A differences, cumulative cost charts and annual transition counts.
The Charging & feasibility panel contains a note only.
F08 is excluded from the completed M1 feature scope.

## Calculation and state model

The custom `simulateProject` function derives the baseline and Scenario results from one Project document.
The same Effective Vehicle interpretation drives calculations, timeline state and 3D views.

The Project document format is version 1.
Save writes one complete Project.
Export includes unsaved edits.
Import validates the file and creates an independent local Project.

Invalid drafts preserve the last valid Project value.
Failed saves preserve current edits.
Revision checks reject stale writes.
Project history groups continuous edits into one undo step.

## M1 workflow

1. Create, open or import a Project.
2. Create or edit a Vehicle Preset.
3. Add or select a Vehicle.
4. Set its baseline Preset and inputs.
5. Select a Scenario.
6. Assign a target Preset.
7. Assign a transition year.
8. Inspect calculated results.
9. Select years before and after the transition.
10. Inspect the corresponding fleet and 3D state.
11. Save the Project.
12. Reopen the Project.

## M1 delivery

M1 is due on 4 October 2026 at 23:59 Singapore time.
