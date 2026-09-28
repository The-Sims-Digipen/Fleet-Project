# F08 — Power & Feasibility Information

**M1 priority:** SHOULD  
**Primary owner:** Dayton Ng Zhi Jie

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). Until a real feasibility engine is scheduled, F08 remains explicitly provisional; any future functional values must consume the canonical project/scenario state rather than introducing a separate charging model inside the panel.

## User capability

Users can view charging, energy and power-feasibility information associated with a planned fleet transition.

## User need

Financially attractive plans may still be operationally constrained by charging access, dwell time, installed charger power or the site's electrical connection.

## Current scope

The UI may continue to show the intended information hierarchy in M1, but the full charging/power feasibility engine is not part of the M1 MUST contract.

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

If included in the M1 build, the panel should use the shared design system and clearly communicate its provisional/indicative status rather than presenting mock values as calculated results.
