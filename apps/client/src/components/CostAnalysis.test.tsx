import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createProjectFixture } from "../domain/projectFixture";
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
    expect(charts).toHaveLength(2);
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

  it("labels fleet cost ratios unavailable when their denominators are zero", () => {
    useProjectStore.getState().deleteVehicle("UNIT-01");
    render(<CostAnalysis />);

    expect(screen.getByText("Fleet cost / km").parentElement).toHaveTextContent("Unavailable");
    expect(screen.getByText("Mean fleet cost / vehicle").parentElement).toHaveTextContent("Unavailable");
  });
});
