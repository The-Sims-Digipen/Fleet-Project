import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createProjectFixture } from "../domain/projectFixture";
import { normalizeProject } from "../domain/project";
import { simulateProject } from "../domain/simulation";
import { createProjectState, useProjectStore } from "../state/projectStore";
import { CostAnalysis } from "./CostAnalysis";

vi.mock("echarts-for-react", () => ({
  default: ({ option }: { option: { series: Array<{ name: string; data: number[] }> } }) =>
    <output data-testid="chart-series">{JSON.stringify(option.series)}</output>,
}));

afterEach(cleanup);
beforeEach(() => useProjectStore.setState(createProjectState(createProjectFixture())));

describe("Derived cost analysis", () => {
  it("reflects the active Scenario transition using Project fleet inputs", () => {
    const document = useProjectStore.getState().runtime.document;
    useProjectStore.getState().replaceVehicleTransitions("plan-a", "UNIT-01", [
      { year: document.analysis.startYear, targetPresetId: "electric-van" },
    ]);
    render(<CostAnalysis />);

    const fuel = screen.getByText("Fuel used").parentElement!;
    expect(fuel).toHaveTextContent("0 L");
    expect(fuel).toHaveTextContent("Baseline: 26,600 L");
    expect(screen.getByText("Transition CAPEX").parentElement).toHaveTextContent("SGD 45,000.00");
    expect(screen.getByRole("img", { name: "Cumulative cost comparison for Plan A" })).toBeInTheDocument();
  });

  it("feeds every ordered transition into annual and cumulative chart series", () => {
    useProjectStore.getState().replaceVehicleTransitions("plan-a", "UNIT-01", [
      { year: 2028, targetPresetId: "hybrid-van" },
      { year: 2030, targetPresetId: "electric-van" },
      { year: 2032, targetPresetId: "diesel-van" },
    ]);
    const current = useProjectStore.getState().runtime.document;
    const expected = simulateProject(current);
    render(<CostAnalysis />);

    const charts = screen.getAllByTestId("chart-series").map((element) =>
      JSON.parse(element.textContent ?? "[]") as Array<{ name: string; data: number[] }>,
    );
    expect(charts).toHaveLength(3);
    expect(charts[0][1]).toMatchObject({
      name: "Plan A",
      data: expected.scenarios["plan-a"].annual.map((year) => year.cumulativeCashCost),
    });
    expect(charts[1][1]).toMatchObject({
      name: "Plan A",
      data: expected.scenarios["plan-a"].annual.map((year) => year.netCashCost),
    });
    expect(expected.scenarios["plan-a"].annual.map((year) => year.transitionCount)).toEqual([
      0, 0, 1, 0, 1, 0, 1, 0, 0, 0,
    ]);
  });

  it("shows derived comparison KPIs and preserves negative emissions reduction", () => {
    const store = useProjectStore.getState();
    store.updateAnalysis({ fuelEmissionsKgCo2ePerLitre: 1, electricityEmissionsKgCo2ePerKWh: 10 });
    store.replaceVehicleTransitions("plan-a", "UNIT-01", [
      { year: store.runtime.document.analysis.startYear, targetPresetId: "electric-van" },
    ]);
    render(<CostAnalysis />);

    expect(screen.getByText("Scenario − baseline cost difference").parentElement).toHaveTextContent("SGD");
    expect(screen.getByText("Fleet cost / km").parentElement).toHaveTextContent("SGD");
    expect(screen.getByText("Mean fleet cost / vehicle").parentElement).toHaveTextContent("SGD");
    expect(screen.getByText("Fuel displaced").parentElement).toHaveTextContent("L");
    expect(screen.getByText("Emissions reduction").parentElement).toHaveTextContent(/-\d.*%/);
  });

  it("keeps annual financial results, signed savings, and selected-year values aligned with shared input edits", () => {
    const document = createProjectFixture();
    document.analysis = { ...document.analysis, yearCount: 4, discountRate: 0, fuelPricePerLitre: 2, electricityPricePerKWh: 0.25 };
    document.environment.vehicles[0] = {
      ...document.environment.vehicles[0], annualKm: 10_000, replacementYear: null,
      currentHolding: { kind: "owned", currentValue: 0, endResidualValue: 0 },
    };
    document.vehiclePresets = document.vehiclePresets.map((preset) => preset.id === "diesel-van"
      ? { ...preset, litresPer100Km: 10, maintenanceCostPerYear: 500 }
      : preset.id === "electric-van"
        ? { ...preset, kWhPer100Km: 20, chargingEfficiency: 1, purchaseCost: 12_000, maintenanceCostPerYear: 200, acquisition: { kind: "owned", endResidualValue: 2_000 } }
        : preset);
    document.scenarios[0].vehiclePlans["UNIT-01"] = { transitions: [{ year: 2026, targetPresetId: "electric-van" }] };
    useProjectStore.setState(createProjectState(normalizeProject(document)));
    render(<CostAnalysis />);

    expect(screen.getByText("OPEX").parentElement).toHaveTextContent("SGD 2,800.00");
    const table = screen.getByRole("table", { name: "Annual financial results" });
    const firstYear = within(table).getByRole("row", { name: /^2026 / });
    expect(within(firstYear).getAllByRole("cell").map((cell) => cell.textContent))
      .toEqual(["SGD 2,500.00", "SGD 12,700.00", "SGD -10,200.00", "SGD -10,200.00"]);
    expect(firstYear).toHaveAttribute("aria-current", "true");
    const savingsChart = JSON.parse(screen.getAllByTestId("chart-series")[2].textContent!);
    expect(savingsChart[0].data.map((point: { value: number }) => point.value)).toEqual([-10_200, 1_800, 1_800, 1_800]);

    act(() => {
      useProjectStore.getState().setPlanSelectedYear(2027);
      useProjectStore.getState().updateAnalysis({ electricityPricePerKWh: 0.5 });
    });

    const selectedYear = screen.getByRole("region", { name: "Selected year financial results" });
    expect(selectedYear).toHaveTextContent("Selected year: 2027");
    expect(selectedYear).toHaveTextContent("Plan costSGD 1,200.00");
    expect(selectedYear).toHaveTextContent("Annual savingsSGD 1,300.00");
    expect(selectedYear).toHaveTextContent("Cumulative savingsSGD -9,400.00");
    expect(screen.getByText("OPEX").parentElement).toHaveTextContent("SGD 4,800.00");
    expect(within(table).getByRole("row", { name: /^2027 / })).toHaveAttribute("aria-current", "true");
  });

  it("labels fleet cost ratios unavailable when their denominators are zero", () => {
    useProjectStore.getState().deleteVehicle("UNIT-01");
    render(<CostAnalysis />);

    expect(screen.getByText("Fleet cost / km").parentElement).toHaveTextContent("Unavailable");
    expect(screen.getByText("Mean fleet cost / vehicle").parentElement).toHaveTextContent("Unavailable");
  });
});
