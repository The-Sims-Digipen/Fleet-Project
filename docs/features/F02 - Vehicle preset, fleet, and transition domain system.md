# F02 — Vehicle preset, fleet, and transition domain system

**Owner:** Zhi Kai  
**Active:** M1 W01-M2 W03

## What this feature must accomplish

The same vehicle/preset model drives the UI, simulation, persistence, roadmap, suitability system, and 3D scene without hard-coded ICE→EV assumptions.

## Required behavior

- user-defined vehicle preset CRUD with reusable technical/economic parameters;
- individual vehicle CRUD and operational attributes;
- stable identifiers and reference validation;
- search, filtering, sorting, grouping, arbitrary multi-selection, and bulk operations;
- generic current-preset → target-preset transition assignment with year editing/clearing;
- annual projected vehicle state and fleet composition for arbitrary staged plans;
- transition counts/roadmap data grouped by preset/category;
- bay-assignment domain state and unassigned/capacity conditions;
- deterministic fixtures plus domain/unit tests for invalid references, edge years, deletion rules, and mixed transitions.

### Preset and vehicle data
A user-defined preset must carry the reusable fields needed by simulation and visualization: stable ID, name/category, propulsion or energy source, ownership model, purchase/lease economics, maintenance, residual/end-of-analysis assumptions, efficiency/consumption, usable range and charging capability where applicable, and physical/model information used by the depot view.

Each fleet vehicle has a stable ID and current-preset reference plus operational inputs such as age, annual and typical daily distance, operating days, route/duty-cycle classification, route predictability, depot-return behavior, external charging access, dwell availability, utilisation, and planned replacement year. Economics that belong to a preset should not be duplicated per vehicle unless a deliberate override is supported.

### Preset/fleet APIs
Implement typed operations/selectors for preset CRUD, vehicle CRUD, bulk selection/editing, schedule assignment/clear, annual projected state, transition counts, and bay assignment. UI components must call these operations rather than implement business rules locally.

### Generic transitions
Do not encode `ICE`, `diesel`, `EV`, or `electric` as required identifiers. Energy-specific simulation behavior comes from preset properties/capabilities. A vehicle's current preset and scenario target preset are references. Partial and staged plans must work for arbitrary selections; 25/50/75/100% adoption are example stages, not hard-coded steps.

### Bay assignment
A scenario can assign one fleet vehicle to one bay. A vehicle occupies at most one bay and a bay holds at most one vehicle. Unassigned depot-returning vehicles and insufficient bay capacity remain explicit conditions rather than being silently repaired.

### Reference safety
Preset deletion, vehicle deletion, scenario schedule references, and bay assignments must be validated/updated atomically. Preserve IDs when editing or duplicating unless a new entity is intentionally created.

### Tests
Cover mixed presets, unscheduled vehicles, same/different target preset, first/last analysis years, invalid target references, deletion of referenced preset, bulk transition/clear, scenario independence, annual composition, and assignment uniqueness.

## Related implementation docs

- [System architecture](../tech/architecture.md)
