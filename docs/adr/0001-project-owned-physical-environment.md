# Projects own one physical planning environment

A Project persists exactly one physical environment, its authoritative fleet, vehicle preset catalogue, shared assumptions, and multiple Scenario overlays. The separate user-facing World lifecycle is removed.

This boundary matches the product question: a Project answers “what physical system am I planning?” while a Scenario answers “what alternative plan am I evaluating for that system?” A separately persisted World allowed combinations that the product does not currently need and made save, reference, and lifecycle rules harder to reason about.

Fleet vehicles are stable generic instances owned by the Project. Each owns one world transform and may reference one reusable Vehicle Preset. New Vehicles receive the first unused transform from the ordered default spawn positions; no parking or spawn-slot identity is persisted. The renderer derives Vehicle views from that fleet rather than persisting a second set of scene objects. Scenario plans reference stable vehicle IDs, so changing a preset preserves plan identity; deleting a vehicle removes every Scenario plan keyed by it.

Because the product is pre-release, existing multi-World development data is discarded instead of migrated. Independent depots are separate Projects. A portfolio abstraction can be introduced later if cross-project planning becomes a real requirement.

