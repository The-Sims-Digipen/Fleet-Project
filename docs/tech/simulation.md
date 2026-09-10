# Annual simulation model

Model: `annual-v1`. Owner: Elijah Chua Jye Kang; vehicle suitability: Yap Zhi Kai. The model provides indicative annual cost, energy, emissions, and feasibility comparisons. Worked examples use synthetic values rather than market forecasts.

## Time, units, and assumptions

- Model whole calendar years from `startYear` through `startYear + years - 1`. Transition, replacement, and charger installation occur at the start of their chosen year; annual operation follows; terminal residual credits occur after the final year's operation.
- Use km, litres, kWh, kW, hours, kgCO2e, and one project currency. Prices and efficiencies are constant in real nominal input units across the horizon: no inflation, discounting, tax, subsidy, interest, or battery degradation. All comparisons use the project currency.
- Each vehicle has constant annual distance/maintenance assumptions while using each technology. `utilisation` informs ranking; it does not multiply annualKm again. typicalDailyKm and operatingDays inform charging checks; flag a material mismatch with annualKm rather than silently replacing either input.
- One scheduled ICE replacement and one optional EV transition are modeled per vehicle. The selected asset is retained through the horizon; no automatic second replacement is inferred. Display this limitation for long horizons. Baseline replacementYear is independent of scenario transition year.
- Operational emissions include ICE fuel use and electricity supplied to charging, using user factors. Vehicle/battery manufacturing, embodied charger emissions, and disposal emissions are excluded. Grid factors are identical for depot and external charging in this version.

## Annual fleet state and baseline

A missing transition entry means ICE for the entire horizon. For a transition at t, a vehicle is ICE for years < t and EV for years >= t. Count a transition only in t. Each scenario uses the same project fleet and analysis settings for its ICE baseline.

In the baseline, acquire a replacement ICE at replacementYear r, if set. In the scenario: if t <= r, skip that ICE replacement and acquire the EV at t; if r < t, acquire the replacement ICE at r and later replace it with the EV at t. If no t exists, follow baseline replacement behavior. Exactly one vehicle exists per fleet ID in each year; purchasing does not add to fleet count.

Existing owned vehicles are sunk assets: do not charge their historic purchase cost. Their initial market value is used for sale interpolation, not as new CAPEX. Leased vehicles incur the supplied annual lease payment while active. An owned acquisition incurs purchaseCost once; a leased acquisition incurs no purchase CAPEX and pays its annualPayment each active year. Maintenance and energy are additional; lease payments are assumed to exclude both. Charge a leased holding's exitFee when it is replaced/transitioned; use zero when no fee is intended. Do not charge exit fees merely because the analysis horizon ends.

## Disposal and residual values

For an owned holding active from start-of-year index a to horizon end N, with acquisition/current value P and supplied horizon residual R, its disposal value at start of index t is:

`V(t) = P + (R - P) * (t - a) / (N - a)`

Use a=0 for existing assets. Use the actual acquisition-year index for acquired assets. R is an explicit end-of-analysis value, not an automatically estimated resale price. All allowed purchases occur before N. At replacement/transition, credit V(t) for the outgoing owned holding. At horizon end, credit R only for the final owned holding. Never credit both early disposal and terminal residual for the same disposed holding. Leased holdings have no sale/residual credit.

Charger purchase and installation costs are CAPEX in the installation year regardless of current use or the selected charging strategy. Owned infrastructure has no residual value in annual-v1. Existing/prepaid infrastructure is represented by zero acquisition costs at the start year. Do not silently erase costs because a user selects external charging while still retaining planned chargers.

## Energy, annual costs, and totals

For annual distance D:

- ICE fuel litres = `D * litresPer100Km / 100`.
- EV battery energy = `D * kWhPer100Km / 100`.
- Supplied charging energy = `battery energy / chargingEfficiency`.
- Depot supplied energy = supplied energy × depotShare; external energy is the remainder.
- Fuel cost = litres × project fuel price. Electricity costs use the scenario's respective depot/external tariffs.
- Annual operating cost = fuel + depot energy + external energy + active-technology maintenance + active lease payments.
- Annual net cash cost = acquisition CAPEX + lease exit fees + operating cost − disposal credits.
- Cumulative cost is the running sum of annual net cash cost, excluding terminal credit.
- TCO = sum of annual net cash cost − final owned-vehicle terminal credits.
- Total transition-plan CAPEX = all actual owned vehicle acquisitions plus charger purchase/installation; report EV, retained/replacement ICE, and charger contributions separately so “transition CAPEX” is not mistaken for incremental cost. Lease payments remain OPEX.
- Savings = baseline TCO − scenario TCO; positive values mean the plan costs less. Also show scenario-minus-baseline cost difference with an explicit label.
- Fleet cost/km = fleet TCO / sum of all annual fleet km. Mean fleet cost/vehicle = fleet TCO / fleet size. Return null for zero denominators. Per-vehicle TCO excludes shared charger costs and is labeled accordingly; fleet totals include them.
- Fuel displaced = baseline litres − scenario litres. Emissions = ICE litres × fuel factor + supplied electricity × electricity factor. Reduction = baseline emissions − scenario emissions; percentage = reduction / baseline emissions × 100, or null when baseline emissions is zero. Negative reduction is valid and must be shown.

Keep full numeric precision during calculation; round only display amounts to two decimal currency places and suitable metric precision. Numerical reference tests compare within 1e-6 currency/metric units for these small fixtures.

## Payback and explanations

Define annual cumulative cash savings as baseline cumulative cost minus scenario cumulative cost. Exclude terminal residual credits from payback so a hypothetical terminal sale cannot manufacture an operating breakeven. Display residual-adjusted TCO separately.

`paybackYear` is the first end-of-year where cumulative cash savings is nonnegative and remains nonnegative at every later modeled year. If it never does, return null/`not-reached`. Later staged CAPEX can therefore delay apparent payback. Use `initial-parity` only when the scenario has no positive upfront cost premium at the start year and cumulative savings is nonnegative throughout; return startYear and label “No upfront premium; cash savings stay nonnegative.” Otherwise use `reached` and label an end-of-year value, with no fractional-year interpolation.

Assumption impact compares the before/after input snapshots, lists changed fields, and reports resulting cost/emissions differences. For multiple simultaneous edits, report the combined impact; do not claim a causal decomposition or automated sensitivity analysis. Project-wide fuel changes recompute both the baseline and scenarios; a scenario electricity tariff change affects only that plan. Schedule/layout values stay unchanged during price-only edits.

## Charging and physical feasibility

For each EV/year, typical depot supplied daily kWh = typicalDailyKm × EV kWh/km × depotShare / efficiency. Sum across EVs requesting depot charging. Installed capacity P is the sum of powerKW for chargers with installationYear <= selected year; chargers must also have a valid finite numeric configuration. Placement conflicts do not secretly remove planned chargers from cost/power calculations: return infeasibility alongside indicative results.

Use a deliberately conservative shared charging window H: the minimum depotDwellHours among EVs requesting depot charging. Required aggregate charging power is daily depot energy / H when H > 0. If P=0 with positive depot demand, report `NO_DEPOT_CHARGER`. If H=0, report `NO_DEPOT_DWELL`. If daily depot energy > P×H, report `INSUFFICIENT_CHARGING_WINDOW` with energy shortfall. This is a shared-window approximation, not vehicle-level charging-session scheduling; do not imply a connection assignment has been simulated.

For a selected-year overload view, indicative demand is full installed nameplate power P when any EV requests depot energy, otherwise zero. If demand > connectionLimitKW, report `SITE_POWER_OVERLOAD`. This tests conservative simultaneous charger use, not optimized load management. Show both the nameplate demand and energy/dwell check; passing one does not guarantee the other.

Report required aggregate kW and installed charger count. If chargers exist, an indicative count can be displayed using the mean installed charger power and `ceil(requiredKW / meanPowerKW)`, labeled as assuming identical average-power units. With no chargers or zero dwell, show the kW requirement/issue and ask the user to choose a charger type; do not invent a hardware recommendation.

Additional year-dependent issues:

| Code | Condition / behavior |
|---|---|
| NO_DEPOT_RETURN | A vehicle requests depot charging but does not return to depot. |
| NO_EXTERNAL_ACCESS | External share > 0 for a vehicle lacking external charging access. |
| DAILY_RANGE_EXCEEDED | Typical daily distance exceeds assumed EV range. |
| ANNUAL_DAILY_MISMATCH | abs(annualKm − typicalDailyKm×operatingDays) exceeds 20% of max(annualKm, impliedKm); informational warning. |
| UNASSIGNED_VEHICLE | Depot-returning vehicle has no bay in that scenario. |
| LAYOUT_INFEASIBLE | Site/object geometry validation has blocking issues; show their object IDs and specific reasons. |

An infeasible plan may still display financial results, prominently labeled “Indicative costs — plan has feasibility issues.” Never silently reschedule vehicles, shift demand to external charging, add chargers, or clip power to the connection limit. A user must explicitly change the plan.

## Suitability ranking

Zhi Kai owns the ranking using the current selected year as the candidate EV transition year. It does not modify the plan. Candidates are vehicles still ICE immediately before that year's transitions; vehicles already transitioned in an earlier year are shown separately. In a copied scenario, substitute the candidate's transition year with the selected year and retain other vehicles' schedules. Evaluate its operational factors, the resulting aggregate charging window, and a hypothetical per-vehicle EV-now versus ICE cost comparison; exclude shared charger CAPEX from the economic factor and label this limitation.

Score 0–100 as the sum of eight documented factors: range (20), route predictability (10), depot return/available external access (10), selected charging strategy access (10), available charging window (15), replacement timing (10), utilisation (10), and economics (15).

- Range: 20 if dailyKm <= 80% of assumed range, 10 if <= range, else 0.
- Predictable route: 10; variable: 0.
- Depot return or external access: 10 if either is available, else 0.
- Strategy access: 10 if every nonzero share has its required access, else 0.
- Charging window: 15 when the scenario passes the aggregate daily charging check, otherwise 0. For external-only with external access, award 15 but state external wait/availability is not modeled.
- Replacement timing: 10 when replacementYear <= candidate year, 5 when the following year, otherwise 0 (including no planned replacement).
- Utilisation: 10×utilisation. The operational distance is already in economics and is not multiplied again.
- Economics: 15 if hypothetical per-vehicle savings > 0, 7.5 if equal within 1e-6, otherwise 0.

Classify an operationally constrained candidate separately before ranking: exceeded daily range, absent required access, or failed charging window is a constraint even if other scores are high. Sort unconstrained candidates first, then score descending, then stable vehicle ID. Show every factor's input, points, and reason. Site geometry/power issues remain prominent site-wide warnings; a ranking never certifies site feasibility.

A candidate with full points in every factor scores 100. Keeping those inputs but failing the aggregate charging window gives 85 and an operationally constrained classification; it sorts after every unconstrained candidate, even one scoring below 85. The weights are transparent heuristic rules, not empirically calibrated predictions.

## Synthetic worked fixtures

Unless stated otherwise, fixtures use owned assets, two vehicles only where stated, no taxes/discounting, and full-year operation. Unspecified costs/residuals are zero. They are arithmetic test inputs, not suggested user defaults.

### F01 — four-year single-vehicle transition

Years 2026–2029; annual distance 10,000 km; ICE 10 L/100 km at 2 currency/L; ICE maintenance 500/year. No baseline replacement. Existing ICE current/end values are zero. EV bought in 2026 for 12,000, end residual 2,000; 20 kWh/100 km; efficiency 1; external-only tariff 0.25/kWh; EV maintenance 200/year. Emissions factors: fuel 2 kg/L and electricity 0.5 kg/kWh.

| Result | ICE baseline | EV scenario |
|---|---|---|
| Annual fuel / electricity | 1,000 L | 2,000 kWh |
| Annual operating cost | 2,500 | 700 |
| Annual emissions | 2,000 kg | 1,000 kg |
| Annual net costs, 2026–2029 | 2,500; 2,500; 2,500; 2,500 | 12,700; 700; 700; 700 |
| Cumulative cash cost at horizon | 10,000 | 14,800 |
| Terminal credit | 0 | 2,000 |
| TCO | 10,000 | 12,800 |

Savings = −2,800; EV cost/km = 0.32; total fuel displaced = 4,000 L; electricity = 8,000 kWh; emissions reduction = 4,000 kg (50%). Payback is not reached. Dropping EV purchase cost to 6,000 gives cumulative cash savings −4,200, −2,400, −600, +1,200 and payback at end-2029; TCO becomes 6,800 and savings 3,200.

### F02 — replacement and sale without double counting

Three years 2026–2028. Existing ICE value 6,000, terminal residual 0; baseline replacement in 2027 costs 9,000 with terminal residual 3,000. Both technologies have zero operating cost in this fixture. Transition instead to an EV in 2027 costing 12,000 with terminal residual 4,000.

Existing disposal value at 2027 = 6,000×(1−1/3) = 4,000. Baseline net acquisition 5,000 and terminal credit 3,000 give TCO 2,000. Scenario net acquisition 8,000 and terminal credit 4,000 give TCO 4,000. No ICE replacement is bought in the scenario because transition and replacement are in the same year.

If transition is delayed until 2028, buy replacement ICE in 2027 and dispose of it in 2028 for 9,000+(3,000−9,000)×1/2 = 6,000. Scenario TCO = 9,000−4,000+12,000−6,000−4,000 = 7,000. Do not also credit the disposed ICE's 3,000 terminal residual.

### F03 — charging split and feasibility

Two EVs, each 10,000 annual km and 100 typical daily km over 100 operating days, 20 kWh/100 km, efficiency 1. Depot share 0.5, depot tariff 0.20, external tariff 0.40. Each returns to depot with a two-hour dwell and external access. One 7 kW charger costs 1,000 plus 500 installation; connection limit 6 kW.

Annual fleet energy = 4,000 kWh; depot/external each 2,000 kWh. Energy cost = 400+800 = 1,200/year. Daily depot energy = 20 kWh; window capacity = 7×2 = 14 kWh, shortfall 6 kWh; required aggregate power = 10 kW; indicative two chargers at 7 kW each. Nameplate demand 7 kW exceeds the 6 kW site limit by 1 kW. Both constraint issues appear. Installation incurs 1,500 CAPEX once.

For the same fleet, depot-only energy costs 800/year and external-only 1,600/year; planned installed charger CAPEX is retained until the user removes it. Delaying installation while keeping the EV schedule returns NO_DEPOT_CHARGER before installation and moves the 1,500 CAPEX to the installation year.

### F04 — price impacts

Using F01, raising fuel price by 20% adds 400/year to baseline cost and 1,600 over four years; EV scenario cost is unchanged and savings improve from −2,800 to −1,200. Raising external electricity tariff by 20% adds 100/year and 400 to scenario TCO; baseline is unchanged and savings fall to −3,200. Lowering these prices by 20% gives savings −4,400 and −2,400 respectively.

### F05 — owned versus leased, empty and zero cases

For two years, an initially leased ICE at 1,000/year with exitFee 100, replaced by a leased EV at 800/year in year one, has baseline TCO 2,000 and scenario TCO 1,700 (100+800+800); CAPEX and residual credit are zero. Zero fuel/emission factors produce zero relevant totals and null percentage reduction when the baseline is zero. An empty fleet has zero cost and null per-vehicle/per-km ratios. No test may accept NaN or Infinity.
