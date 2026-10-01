# F01 — Vehicle Presets

**M1 priority:** MUST  
**Primary owner:** Tan Wei Jun

## Current behavior

The Vehicle Presets panel lists the Project's Presets.
Users can create, duplicate, select, edit and delete them.
Preset IDs remain stable across edits.
A new Project starts with five synthetic Presets.

The panel prevents deletion of a referenced Preset.
It lists the Vehicle baselines and Vehicle Plans that use that Preset.

## Editable values

| Group | Values |
|---|---|
| Identity | Name, category and propulsion |
| Energy | Fuel use, electricity use, battery capacity, charging power, range and charging efficiency |
| Economics | Purchase price and annual maintenance |
| Acquisition | Owned or leased |
| Owned terms | End-of-analysis residual value |
| Leased terms | Annual payment and exit fee |
| Appearance | Registered 3D model |

Propulsion options are diesel, petrol, electric and hybrid.
The current Vehicle model selector has one option: Low-poly Van.
A zero range input stores `rangeKm: null`.

## Integration

The panel follows the [M1 integration contract](../tech/m1-integration-contract.md).
It edits Project-owned Vehicle Presets through Project commands.
Vehicle baselines and transitions reference these Presets.
Presets do not create independent scene objects.
Save/export includes Presets within the complete Project.

## Demonstration

1. Create a Preset.
2. Edit its values.
3. Assign it to a Vehicle baseline or Scenario transition.
4. Save the Project.
5. Reopen the Project.
6. Inspect the restored Preset.
