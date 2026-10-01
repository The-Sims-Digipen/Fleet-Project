# F06 — Financial & Payback Results

**M1 priority:** MUST  
**Primary owner:** Yap Zhi Kai

## Current behavior

The Cost & emissions panel displays results for the active Scenario.
The custom `simulateProject` function supplies its calculations.
Shared Analysis Settings also define the no-transition baseline.

| Result group | Values |
|---|---|
| Cost | TCO, savings, Scenario-minus-baseline difference, transition CAPEX and OPEX |
| Unit costs | Fleet cost per kilometre and mean cost per Vehicle |
| Payback | Year reached, initial parity or not reached |
| Energy | Fuel used, fuel displaced and electricity used |
| Emissions | Operational emissions, reduction and reduction percentage |
| Selected year | Net cash cost, baseline cost, Plan cost, annual savings and cumulative savings |

TCO uses the Project discount rate.
OPEX covers the full analysis period.
Positive baseline savings mean the Scenario costs less.
Positive Scenario-minus-baseline cost means it costs more.
Undefined ratios are unavailable.
Negative savings and emissions reductions retain their signs.

## Charts and table

The panel includes:

- Cumulative cash-cost lines for the baseline and active Scenario.
- Annual net cash-cost bars.
- Annual net-savings bars.
- An annual financial table with baseline/Plan costs and annual/cumulative savings.

Cash charts show nominal values.
The cumulative chart marks the selected year and a reached payback year.
The financial table marks the selected-year row.

## Integration

The panel follows the [M1 integration contract](../tech/m1-integration-contract.md).
`ProjectSimulation` and `ScenarioSimulation` contain calculation output.
`createFinancialViewModel` prepares displayed values.
KPI cards and charts do not use independent financial calculations or fixed result values.

## Demonstration

1. Change a Scenario transition or economic assumption.
2. Inspect the updated KPI values.
3. Inspect the updated charts and annual table.
4. Inspect the payback status.
