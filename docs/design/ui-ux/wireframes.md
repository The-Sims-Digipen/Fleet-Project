# Workspace wireframes and flows

These wireframes describe the current M1 interface. They show information order and interaction. They do not specify final visual styling.

The [product design](../product-design.md) describes the current application and its data ownership.

Square brackets identify controls. Values illustrate the layout. They are not real user or market data.

## WF01 — New and Open dialogs

The application starts in the workspace. The header provides `New` and `Open`.

```text
Project name: Untitled project
[New] [Open] [Import] [Export] [Save]  Not saved yet
Mode: [Plan / Depot] [Compare]

+----------------------------------------------------------+
| New Project                                              |
| Starts with the default depot, ten initial Vehicle       |
| positions, and Plan A.                                   |
|                                                          |
| Project name                                             |
| [Untitled project___________________________________]    |
|                                                          |
| Unsaved changes in the open Project will be discarded.   |
|                         [Cancel] [Create Project]        |
+----------------------------------------------------------+

+----------------------------------------------------------+
| Open Project                                             |
| Choose a project saved locally in this browser.          |
|                                                          |
| Depot transition                                         |
| 2 scenarios · Updated 10 Sep 2026              [Open]    |
|                                                          |
| No saved projects yet.  (when the list is empty)         |
|                                               [Cancel]   |
+----------------------------------------------------------+
```

The discard warning appears when the open Project has unsaved changes. `Cancel` retains that Project.

The Open dialog shows a loading state or an error with `Retry` when necessary. There is no home route or sample-opening control.

New Projects have an empty fleet, five synthetic Presets, and `Plan A`. Their default analysis period is 2026–2035, in SGD.

## WF02 — Plan / Depot workspace

The viewport appears beside the resizable sidebar. The sidebar starts at 420 CSS px wide.

```text
Project name: Depot transition
[New] [Open] [Import] [Export] [Save]  Unsaved changes
Mode: [Plan / Depot] [Compare]   [Undo] [Redo]
+---------------------------------------+--------------------------------+
| 3D viewport                           | Scenarios                      |
| Plan A · 2027                         | [New] [Duplicate] [Remove]     |
|                                       | Plan A · Active                |
| Shared Project environment            | Active scenario name: [Plan A] |
|                                       +--------------------------------+
| Depot and fleet Vehicles              | Fleet Management               |
| Changed Vehicles appear green.        | [Add vehicle]                  |
|                                       | City Van             Changed   |
| Selected Vehicle has an outline.      | Delivery Truck       Current   |
|                                       | Selected Vehicle inputs        |
|                                       | Target preset: [Electric Van v]|
|                                       | Year to change: [2027 v]       |
|                                       | [Delete]                       |
|                                       +--------------------------------+
|                                       | Timeline · Selected year: 2027 |
|                                       | 2026 [---o---------------] 2035|
|                                       | [Play] [Reset]                 |
|                                       | Transition events              |
|                                       +--------------------------------+
| MMB orbit · Shift+MMB pan             | Vehicle Presets                |
| Scroll zoom                           | Analysis Settings              |
|                                       | Charging & feasibility         |
|                                       | Cost & emissions               |
|                                       | Audio demo                     |
+---------------------------------------+--------------------------------+
```

The diagram compresses the sidebar to show its panel order. The actual sidebar scrolls vertically.

The fleet list supports one Vehicle selection. Its transition controls edit the first transition and preserve later transitions.

The Timeline panel has a year slider and transition markers. It has no year dropdown.

`Cost & emissions` contains metrics, selected-year values, charts, and an annual table. The results use the open Project's data.

`Charging & feasibility` contains an information message. M1 does not calculate charging strategies or site power.

At widths of 900 CSS px or less, the sidebar moves below the viewport. The separator then controls sidebar height.

## WF03 — development editor

Development builds add these tools to `Plan / Depot`. Production builds do not show the transform toolbar, Inspector, Scene, or Debug panels.

```text
+---------------------------------------+---------------------------------+
| 3D viewport                           | Inspector                       |
| [Move W] [Rotate E] [Scale R]         | Selected typed Project object   |
| [Gizmo] [World Q] [Snap]              | Position (m): [X] [Y] [Z]       |
|                                       | Rotation (°): [X] [Y] [Z]       |
| Selected Depot or Vehicle             | Scale:        [X] [Y] [Z]       |
| Transform gizmo                       |                                 |
|                                       | Baseline Vehicle fields         |
|                                       | Active Scenario transitions     |
|                                       | Target preset: [Preset v]       |
|                                       | Transition year 1: [2027]       |
|                                       | [Remove transition]             |
|                                       | [Add transition]                |
|                                       | Effective state · 2027          |
|                                       +---------------------------------+
|                                       | Scene                           |
|                                       | Light intensity: [------o--]    |
|                                       | [Reset camera]                  |
|                                       +---------------------------------+
|                                       | Debug · Project document        |
+---------------------------------------+---------------------------------+
```

The Inspector edits the selected Depot or Vehicle transform. Vehicle inspection also provides the full transition list and read-only effective state.

World and Local identify transform coordinate spaces. They do not identify separate persisted environments.

There are no site polygon, obstacle, bay, or charger creation tools in M1.

## WF04 — comparison

```text
Project name: Depot transition
[New] [Open] [Import] [Export] [Save]  Saved locally
Mode: [Plan / Depot] [Compare]

Compare Project Scenarios                         Selected year: 2027
Shared timeline: 2026 [---o---------------------] 2035  [Play] [Reset]
Year buttons: [2026] [2027] [2028] ... [2035]
+------------------------------------+------------------------------------+
| Plan A · 2027 view                 | Plan B · 2027 view                 |
| Scenario for Plan A: [Plan A v]    | Scenario for Plan B: [Plan B v]    |
| [Reset view]                       | [Reset view]                       |
| Shared Project environment         | Shared Project environment         |
| Independent 3D camera              | Independent 3D camera              |
| TCO · Transition CAPEX · OPEX      | TCO · Transition CAPEX · OPEX      |
| Savings · Payback · Emissions      | Savings · Payback · Emissions      |
| Selected-year results              | Selected-year results              |
+------------------------------------+------------------------------------+
Plan B minus Plan A: financial, emissions, and transition differences
Cumulative Project cost: both Scenario series and selected-year marker
Vehicles transitioning each year: annual comparison table
```

Both columns share the Project environment, fleet, Presets, and Analysis Settings. The shared timeline changes both views.

The other column's Scenario is disabled in each selector. With one Scenario, the second selector is disabled.

The empty second column instructs the user to create or duplicate another Scenario in `Plan / Depot`.

The header tab returns the user to planning. There are no inline `Duplicate`, `Edit A`, or `Edit B` controls.

Each column has a minimum width of 520 CSS px. Smaller screens permit horizontal scrolling. Camera controls remain independent.

## WF05 — saving and recovery

```text
Header during save:
[Save disabled]  Saving…

Header after failure:
[Retry Save]  Save failed
Failure details: the save message and "Your edits are still here."

New or Open dialog with unsaved changes:
Unsaved changes in the open Project will be discarded.
[Cancel]  [Create Project or Open]

Import confirmation with unsaved changes:
Importing a project will replace the current unsaved workspace.
Continue?  [Cancel] [OK]
```

Failure details appear in the status tooltip and accessible status text. Failed saves retain the current edits.

`Saved locally` appears after IndexedDB accepts the captured state. Edits made during the save retain `Unsaved changes`.

A stale revision produces a save error. M1 has no conflict-specific reload or save-as-new controls.

The browser can show its native close or reload warning when changes are unsaved.
