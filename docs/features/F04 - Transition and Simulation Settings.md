# F04 — Transition & Simulation Settings

**M1 priority:** MUST  
**Primary owner:** Elijah Chua Jye Kang

## Current transition controls

The fleet form sets a target Preset and year for the selected Vehicle.
It edits the first transition in the active Scenario.
It preserves later transitions already in that Vehicle Plan.
If the user clears the target or year, the form removes the first transition.

The domain supports multiple ordered transitions with distinct years.
Import, save, calculations, timeline and 3D views preserve the complete Vehicle Plan.
The baseline Preset applies before the first transition.
The latest transition at or before the selected year determines the Effective Vehicle.

The year selector uses the Project analysis period.
An existing transition outside that period remains visible as an outside-period option.

## Shared Analysis Settings

| Group | Editable values |
|---|---|
| Period | Start year and number of years |
| Currency | Project currency |
| Prices | Fuel price and one electricity price |
| Finance | Discount rate |
| Emissions | Fuel and grid emissions factors |

These values apply to the baseline and every Scenario.
A valid shared-assumption edit recalculates all results.
Invalid numeric drafts remain local.
They do not replace the last valid Project value.

## Integration

The feature follows the [M1 integration contract](../tech/m1-integration-contract.md).
Project commands change shared Analysis Settings and Scenario Vehicle Plans.
Shared Vehicle baselines do not contain Scenario transitions.
Each Scenario's Vehicle Plan remains independent.

## Demonstration

1. Select a Vehicle.
2. Select a target Preset.
3. Select a transition year.
4. Inspect the calculated results.
5. Change a shared price.
6. Inspect the updated baseline and Scenario results.
7. Inspect the Effective Vehicle at the transition year.
