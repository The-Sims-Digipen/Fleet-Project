# F08 — Power & Feasibility Information

**M1 priority:** SHOULD  
**Primary owner:** Dayton Ng Zhi Jie

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). F08 is deferred from the M1 Project contract and UI. When scheduled, its values must consume the canonical Project/Scenario state rather than introducing a separate charging model inside the panel.

## User capability

Users can view charging, energy and power-feasibility information associated with a planned fleet transition.

## User need

Financially attractive plans may still be operationally constrained by charging access, dwell time, installed charger power or the site's electrical connection.

## Current scope

M1 shows a short later-scope note only. It does not persist Scenario charging assumptions or parking assignments and does not present placeholder demand, capacity, or feasibility results. The later requirement remains: add charging strategy, feasibility, and Charger visualization to the Project environment and Scenario planning without creating a parallel authoritative store.

Future functional scope includes:

- Site connection limit.
- Estimated/indicative charging demand.
- Installed charging capacity.
- Available capacity.
- Depot/external/mixed charging assumptions.
- Feasible/infeasible warnings with specific reasons.
- States such as `Within Capacity` and `Power Limit Exceeded` that do not rely on colour alone.

## Technical dependencies

The functional version depends on the fleet/scenario state and simulation outputs and is expected to be backed by a dedicated charging/power feasibility engine in a later milestone.

## M1 evidence

The M1 UI must not present mock values as calculated results. A later implementation must use the shared design system and clearly label indicative feasibility.
