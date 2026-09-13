# F12 — Dynamic scenario visualization and dual-scene comparison

**Owner:** Wei Jun  
**Active:** M3 W02–M4 W01

## What this feature must accomplish

Both comparison scenes accurately show their own scenario at the same year and remain interactive without shared mutable scene state.

## Required behavior

- installation-year charger visibility and authoring ghost behavior;
- vehicle model/appearance changes from projected target presets;
- overload/constraint overlays tied to structured feasibility results;
- independent left/right scenes for comparison with synchronized year but independent camera/selection;
- correct scene refresh after scenario duplication, save/reopen, and layout changes;
- renderer/resource isolation so switching scenarios cannot leak meshes/listeners or mutate the other scene;
- browser performance/interaction coverage under the dual-scene reference workload.

### Dynamic single/dual scene state
Extend F05 so scene content is driven by scenario/year projected data and F09 feasibility issue output. Compare mode creates distinct scene roots/state for left and right scenarios.

### Charger/preset temporal behavior
Plan/Compare show installed chargers only; depot authoring can show future chargers as clearly non-installed ghosts. Vehicle appearance/model follows active projected preset. Scenario duplication/reopen/layout changes force correct refresh without stale meshes.

### Constraint visualization
Map issue IDs/affected objects into overlays/highlights/status, but keep text warnings in the UI. When site demand exceeds the connection limit, the depot/site must receive an immediately obvious red overload treatment (or the project-approved equivalent strong red site overlay) in addition to the text warning. The scene must never hide or “fix” an infeasible plan.

### Isolation/performance
Independent cameras/selections; shared year only. Reusing asset cache is allowed, sharing mutable scene/domain instances is not. Test dual-scene interactions and repeated scenario switches in a real browser.

## Related implementation docs

- [Annual simulation model](../../tech/simulation.md)
- [Architecture](../../tech/architecture.md)
- [Extending the 3D editor](../../tech/extending-the-editor.md)
- [Product design](../../design/product-design.md)
