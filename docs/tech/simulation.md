# Annual simulation model

Model: `annual-v1`. The M1 engine calculates annual energy, cost, emissions, and payback from the Project document.
All Scenarios use the Project Analysis Settings. The worked examples use synthetic values, not market forecasts.

M1 has no Scenario charging strategy, depot charging share, charger plan, or separate depot and external tariffs.
The engine does not calculate charging feasibility or suitability scores.

## Time, units, and assumptions

The analysis covers whole calendar years from `startYear` through `startYear + yearCount - 1`, inclusive.
A replacement or transition occurs at the start of its year. Annual operation follows that event.
The final residual credit occurs after the last year's operation.

Use these units:

- Distance: km.
- Fuel: litres.
- Electricity: kWh.
- Emissions: kgCO2e.
- Money: the Project currency.

Fuel and electricity prices, emissions factors, and the discount rate belong to the Project.
The engine uses the discount rate for present-value total cost of ownership (TCO).
It excludes inflation, tax, subsidies, and battery degradation. All comparisons use the same Project currency.

Each Vehicle has constant annual distance and operational inputs.
The effective Vehicle Preset supplies its maintenance and energy inputs.
The Project stores `utilisation`, daily distance, operating days, depot return, depot dwell, and external charging access.
The M1 engine does not use these fields. It uses `annualKm` directly, without a utilisation multiplier.

The baseline can include one replacement with the Vehicle's baseline Preset.
A Scenario can contain multiple ordered transitions. Each target Preset applies until the next transition.
The first transition replaces the baseline purchase if it occurs on or before the baseline replacement year.
Otherwise, the baseline replacement occurs first.
Transitions can occur outside the analysis period.
Events before the period determine the initial Preset and asset holding. The engine does not charge their purchase costs again.
Events after the period add no cost or transition count within that period.

Operational emissions include fuel and supplied electricity, with the Project emissions factors.
The model excludes Vehicle manufacture and disposal emissions.

## Annual fleet state and baseline

Without transitions, a Vehicle keeps its baseline Preset throughout the analysis period.
Its baseline replacement can change its asset holding, but keeps the same Preset.
Each Scenario uses the same Project fleet and Analysis Settings for its no-transition baseline.

For a baseline replacement year `r` and first transition year `t`:

- If no transition exists, use the baseline replacement behavior.
- If `t <= r`, acquire the target Preset at `t` and omit the baseline replacement.
- If `r < t`, acquire the baseline replacement at `r`, then the target Preset at `t`.

Exactly one Vehicle exists per fleet ID in each year. An acquisition does not increase fleet size.

Existing owned Vehicles are assets from before the analysis period.
Do not charge their historical purchase cost.
Use their initial market value to calculate a disposal credit.

An owned acquisition incurs `purchaseCost` once.
A leased acquisition incurs no purchase CAPEX. It incurs its `annualPayment` in each active year.
Add maintenance and energy costs to the lease payment. The supplied lease payment excludes these costs.
When a leased asset is replaced, charge its `exitFee` once. Use zero if no exit fee applies.
The end of the analysis period does not cause an exit fee.

## Disposal and residual values

For an owned asset, calculate its disposal value with:

`V(t) = P + (R - P) * (t - a) / (N - a)`

| Symbol | Meaning |
|---|---|
| `a` | The acquisition-year index. Use zero for an existing asset. |
| `N` | The number of analysis years. |
| `P` | The acquisition value, or the initial market value of an existing asset. |
| `R` | The supplied residual value at the end of the analysis period. |
| `t` | The disposal-year index at the start of that year. |

Use the actual acquisition-year index for an acquired asset, including a negative index for an acquisition before the period.
`R` is an explicit input. The model does not estimate resale prices.
All purchases that affect the period occur before index `N`.

At replacement or transition, credit `V(t)` for the outgoing owned asset.
At the end of the period, credit `R` only for the final owned asset.
Do not give a terminal credit to an asset that already has a disposal credit.
Leased assets have no disposal or terminal credit.

## Energy, annual costs, and totals

For annual distance `D`, calculate the following values:

| Value | Formula |
|---|---|
| Fuel litres | `D * litresPer100Km / 100` for a fuel-consuming Preset. |
| Supplied electricity | `D * kWhPer100Km / 100 / chargingEfficiency` for an electricity-consuming Preset. |
| Fuel cost | Fuel litres × Project fuel price. |
| Electricity cost | Supplied electricity × Project electricity price. |
| Annual operating cost | Fuel cost + electricity cost + maintenance + lease payments. |
| Annual net cash cost | Acquisition CAPEX + lease exit fees + operating cost − disposal credits. |
| Cumulative cash cost | The sum of annual net cash costs up to that year, excluding terminal credit. |
| Nominal TCO | The sum of annual net cash costs − terminal credit. |
| Transition CAPEX | Owned target-Preset acquisitions from Scenario transitions. |
| Replacement CAPEX | Owned acquisitions from baseline replacements. |

Diesel, petrol, and hybrid Presets consume fuel. Electric and hybrid Presets consume supplied electricity.
A hybrid Preset can therefore contribute to both energy totals.
Lease payments remain operating expenditure (OPEX).
M1 totals contain Vehicle costs only.

For discount rate `d` and year index `i`, calculate:

- Discounted annual net cash cost: `netCashCost / (1 + d) ** i`.
- Discounted terminal credit: `terminalCredit / (1 + d) ** yearCount`.
- Present-value TCO: the sum of discounted annual net cash costs − discounted terminal credit.

The first year uses index zero. The engine returns both `nominalTco` and present-value `tco`.
Cash-flow charts and payback use nominal cash values.

Use present-value TCO for these ratios and comparisons:

| Value | Formula or response |
|---|---|
| Savings | Baseline TCO − Scenario TCO. A positive value means the Scenario costs less. |
| Cost difference | Scenario TCO − baseline TCO. Give this value an explicit label. |
| Fleet cost/km | Fleet TCO / total fleet distance over all analysis years. |
| Mean cost/Vehicle | Fleet TCO / fleet size. |
| Zero denominator | Return `null` for the ratio. |

Calculate energy and emissions comparisons with:

| Value | Formula |
|---|---|
| Fuel displaced | Baseline litres − Scenario litres. |
| Emissions | Fuel litres × fuel factor + supplied electricity × electricity factor. |
| Emissions reduction | Baseline emissions − Scenario emissions. |
| Percentage reduction | Reduction / baseline emissions × 100. Return `null` if baseline emissions are zero. |

Negative reductions are valid. Show their sign.
Keep full precision in calculations.
Round currency displays to two decimal places. Use suitable display precision for other units.
Compare small numerical fixtures within `1e-6` currency or metric units.

## Payback and explanations

Annual cumulative cash savings equal baseline cumulative cash cost minus Scenario cumulative cash cost.
Exclude terminal residual credits from payback. A final hypothetical sale must not create an operating breakeven.
Show TCO with its residual credit separately.

`paybackYear` is the first year-end with nonnegative cumulative cash savings that stay nonnegative in every later analysis year.
If no such year exists, return `null` and `not-reached`.
Later staged CAPEX can delay payback.

Use `initial-parity` only if both conditions are true:

- The Scenario has no positive upfront cost premium in the start year.
- Cumulative cash savings stay nonnegative throughout the period.

In this case, return `startYear` with the label “No upfront premium; cash savings stay nonnegative.”
Otherwise, use `reached` for a qualifying year-end. Do not interpolate a fractional year.
The upfront premium includes acquisition CAPEX, lease exit fees, and disposal credits.

A shared price or emissions-factor edit recalculates the baseline and every Scenario.
An Analysis Settings edit leaves Vehicle transition plans and transforms unchanged.

## Synthetic worked fixtures

Unless specified otherwise, use owned assets, full-year operation, no taxes, and a zero discount rate.
Use zero for unspecified costs and residual values.
Use two Vehicles only where the example specifies two.
These values are arithmetic test inputs, not recommended user defaults.
SIM01, SIM02, SIM04, and SIM05 describe the current model.

### SIM01 — four-year single-vehicle transition

Use years 2026–2029 and annual distance of 10,000 km.
The ICE Preset uses 10 L/100 km at 2 currency/L, with maintenance of 500/year.
There is no baseline replacement. The existing ICE Vehicle has zero initial and terminal values.
Buy the EV in 2026 for 12,000, with a terminal residual value of 2,000.
The EV uses 20 kWh/100 km, efficiency 1, the shared electricity price of 0.25/kWh, and maintenance of 200/year.
Use emissions factors of 2 kg/L for fuel and 0.5 kg/kWh for electricity.

| Result | ICE baseline | EV Scenario |
|---|---|---|
| Annual fuel / electricity | 1,000 L | 2,000 kWh |
| Annual operating cost | 2,500 | 700 |
| Annual emissions | 2,000 kg | 1,000 kg |
| Annual net costs, 2026–2029 | 2,500; 2,500; 2,500; 2,500 | 12,700; 700; 700; 700 |
| Cumulative cash cost at horizon | 10,000 | 14,800 |
| Terminal credit | 0 | 2,000 |
| TCO | 10,000 | 12,800 |

Savings are −2,800. EV cost/km is 0.32.
Total fuel displaced is 4,000 L. Total electricity is 8,000 kWh.
The emissions reduction is 4,000 kg, or 50%. The plan does not reach payback.

If the EV purchase cost decreases to 6,000, cumulative cash savings are −4,200, −2,400, −600, and +1,200.
Payback occurs at the end of 2029. TCO becomes 6,800 and savings become 3,200.

### SIM02 — replacement and sale without double counting

Use three years, 2026–2028.
The existing ICE Vehicle has value 6,000 and zero terminal residual value.
Its baseline replacement in 2027 costs 9,000, with terminal residual value 3,000.
Both Presets have zero operating cost in this fixture.
Instead, transition to an EV in 2027 for 12,000, with terminal residual value 4,000.

Existing disposal value in 2027 is `6,000 * (1 - 1/3) = 4,000`.
The baseline net acquisition cost is 5,000. A terminal credit of 3,000 gives baseline TCO of 2,000.
The Scenario net acquisition cost is 8,000. A terminal credit of 4,000 gives Scenario TCO of 4,000.
The Scenario buys no ICE replacement because replacement and transition occur in the same year.

If transition occurs in 2028, buy the ICE replacement in 2027.
Its disposal value in 2028 is `9,000 + (3,000 - 9,000) * 1/2 = 6,000`.
Scenario TCO is `9,000 - 4,000 + 12,000 - 6,000 - 4,000 = 7,000`.
Do not also credit the disposed ICE Vehicle's terminal residual value of 3,000.

### SIM04 — price impacts

Use SIM01.
If fuel price increases by 20%, baseline cost increases by 400/year, or 1,600 over four years.
EV Scenario cost stays the same. Savings improve from −2,800 to −1,200.
If the shared electricity price increases by 20%, EV cost increases by 100/year, or 400 over four years.
Baseline cost stays the same. Savings decrease to −3,200.
If fuel price decreases by 20%, savings become −4,400.
If electricity price decreases by 20%, savings become −2,400.

### SIM05 — owned versus leased, empty and zero cases

Use two years and an initial ICE lease of 1,000/year with `exitFee` 100.
Transition to an EV lease of 800/year in the first year.
Baseline TCO is 2,000. Scenario TCO is `100 + 800 + 800 = 1,700`.
CAPEX and residual credit are zero.

Zero fuel or emissions factors give zero for the related totals.
If baseline emissions are zero, return `null` for percentage reduction.
An empty fleet has zero cost and `null` per-Vehicle and per-km ratios.
Reject `NaN` and `Infinity` in test results.
