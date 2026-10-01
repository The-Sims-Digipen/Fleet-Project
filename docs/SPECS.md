# Fleet Transition Planner

## Accepted M1 scope

This specification describes the implemented M1 product.
F01–F07 form the accepted M1 scope.
Each feature document describes its current controls and behavior.

The product helps fleet operators compare Vehicle transition plans.
It calculates costs, energy use, emissions and payback from editable inputs.
It shows the selected-year fleet in a 3D Depot.

Each Project owns one physical environment, one Depot, Vehicle baselines, Vehicle Presets, shared Analysis Settings and its Scenarios.
The Project document format is version 1.
Each Scenario owns ordered Vehicle Plans.
Scenarios share the Project environment and assumptions.

## Platform and initial state

The product runs in a browser.
The interface uses React, TypeScript, Vite and Tailwind CSS.
Three.js and React Three Fiber provide 3D views.
Zustand holds Project and application state.
ECharts displays financial charts.
IndexedDB stores complete Projects in the current browser.

A new Project has one default Depot, an empty fleet, five synthetic Vehicle Presets and Plan A.
The default analysis period is 2026–2035 inclusive.
The default currency is SGD.

Synthetic fleet examples are test fixtures.
The current interface has no Open sample command.
Preset values are illustrative inputs, not manufacturer specifications.

The Project supports up to ten Vehicles.
A new Vehicle receives the first unused transform from ten predefined positions.
The Project stores each Vehicle's transform.
It does not store the predefined position list or parking assignments.

## Project and Scenario controls

| Control | Current behavior |
|---|---|
| New | Create an unsaved Project with the default state |
| Open | Select a Project saved in the current browser |
| Import | Validate a `.fleetproject` file and save an independent local Project |
| Export | Download the complete Project, including current unsaved edits |
| Save | Save one complete Project to IndexedDB |
| Project name | Rename the current Project |
| Scenario controls | Create, select, rename, duplicate or remove a Scenario |

Scenario duplication copies Vehicle Plans.
A Scenario switch preserves unsaved Project edits.
The active Scenario is part of the saved Project.
The last Scenario cannot be removed.

Project validation rejects an invalid active-Scenario reference.
Removal of the active Scenario selects a remaining Scenario at the same list index.
If that index is unavailable, it selects the last Scenario.

## Vehicle Presets and fleet

Users can create, duplicate, edit and delete Vehicle Presets.
A referenced Preset cannot be deleted.
The interface shows the references that prevent deletion.

| Preset group | Editable values |
|---|---|
| Identity | Name, category, propulsion |
| Energy | Fuel use, electricity use, battery capacity, charging power, range, charging efficiency |
| Economics | Purchase price, annual maintenance, owned/leased acquisition terms |
| Owned acquisition | Residual value at the end of analysis |
| Leased acquisition | Annual payment and exit fee |
| Appearance | Registered 3D model |

Diesel, petrol, electric and hybrid propulsion values are available.
The current Vehicle model selector has one option: Low-poly Van.

The fleet panel selects one Vehicle at a time.
Users can add, edit and delete Vehicles.
Vehicle deletion removes its plans from all Scenarios.

| Vehicle group | Editable values |
|---|---|
| Identity | Name and optional baseline Preset |
| Use | Annual distance, daily distance, operating days and utilisation |
| Operation | Route pattern, Depot dwell, Depot return and external charging access |
| Replacement | Baseline replacement year |
| Owned holding | Current value and end residual value |
| Leased holding | Annual payment and exit fee |

The panel displays the Vehicle ID, world position and selected-year status.
It does not provide filters, sort controls or bulk selection.

## Transition and analysis controls

The fleet form sets a target Preset and year for the selected Vehicle.
The form edits the first transition.
It preserves later transitions already in the Vehicle Plan.
If the user clears the target or year, the form removes the first transition.

The domain, calculations, timeline, 3D views and persistence support multiple ordered transitions.
Transition years are distinct.
The baseline Preset applies before the first transition.
The latest transition at or before the selected year determines the Effective Vehicle.

The Analysis Settings panel edits:

- Start year and number of years.
- Project currency.
- Fuel price and one electricity price.
- Discount rate.
- Fuel and grid emissions factors.

These assumptions apply to the baseline and every Scenario.
Valid edits recalculate their results.
Invalid numeric drafts remain local and preserve the last valid Project value.

## Calculations and results

The custom `simulateProject` function calculates whole-year results from the Project document.
It produces the no-transition baseline and every Scenario result.
The calculation uses effective Presets, distance, energy prices, maintenance, acquisition terms, replacement dates and transition dates.

| Result group | Current output |
|---|---|
| Cost | TCO, baseline savings, Scenario-minus-baseline difference, transition CAPEX and total OPEX |
| Unit cost | Fleet cost per kilometre and mean cost per Vehicle |
| Payback | Year reached, initial parity or not reached |
| Energy | Fuel used, fuel displaced and electricity used |
| Emissions | Operational emissions, reduction and reduction percentage |
| Selected year | Net cash cost, baseline cost, Plan cost, annual savings and cumulative savings |
| Charts | Cumulative cash cost, annual net cash cost and annual net savings |
| Table | Annual baseline/Plan costs and annual/cumulative savings |

TCO uses the Project discount rate.
OPEX covers the full analysis period.
Cash charts show nominal costs.
Undefined ratios are unavailable.
Negative savings and emissions reductions retain their signs.

## Timeline and 3D views

Plan / Depot has a year slider, transition markers, event list, Play/Pause and Reset.
The active Scenario supplies its transition events.
The selected year controls fleet status, 3D state and selected-year results.

The 3D view renders the default Depot and Project Vehicles.
Camera controls support orbit, pan and zoom.
Vehicle selection connects the viewport and fleet panel.
Highlights show the selected Vehicle.
Bright green identifies an effective Preset that differs from the baseline Preset.

Development builds also expose typed object transforms, Inspector and debug controls.
Production builds omit those development controls.

## Compare

Compare displays two distinct Scenarios over the same Project environment.
Both columns use one Compare selected year.
Their camera controls remain independent.
Plan and Compare retain separate timeline state.

Compare displays TCO, transition CAPEX, payback, transition counts, selected-year cash cost and selected-year emissions.
It also displays B-minus-A differences, cumulative cash-cost charts and annual transition counts.

A one-Scenario Project leaves the second selection unavailable.
The interface directs the user to create or duplicate a Scenario in Plan / Depot.

## Save and error behavior

The interface shows unsaved, saved, in-progress and failed save states.
A failed save preserves current edits.
Retry Save repeats the save operation.
Revision checks reject stale writes.

New and Open dialogs warn before they replace unsaved workspace edits.
Import requires confirmation when unsaved edits exist.
Browser close uses the native unsaved-change warning.

Portable import validates the document before it saves a local copy.
The file format and Project document version are both 1.
Camera, selection, timeline playback, undo history and calculated results are not persisted.

## F08 panel status

The Charging & feasibility panel displays an informational note only.
It performs no charging-demand or site-feasibility calculation.
F08 is excluded from the completed M1 feature scope.
