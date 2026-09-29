import { act, cleanup, render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { simulateProject } from "../domain/simulation";
import { createProjectFixture } from "../domain/projectFixture";
import { createProjectState, useProjectStore } from "../state/projectStore";
import { CompareWorkspace } from "./CompareWorkspace";

vi.mock("./ComparisonViewport", () => ({
  ComparisonViewport: ({ scenarioId, year }: { scenarioId: string | null; year: number }) =>
    <div data-testid={`comparison-viewport-${scenarioId ?? "empty"}`} data-year={year} />,
}));
vi.mock("echarts-for-react", () => ({ default: () => <div data-testid="echarts" /> }));

let project = createProjectFixture();

beforeEach(() => {
  project = createProjectFixture();
  project.scenarios[0].name = "Gradual transition";
  project.scenarios[0].vehiclePlans["UNIT-01"] = {
    transitions: [{ year: 2030, targetPresetId: "electric-van" }],
  };
  project.scenarios[1].name = "Early transition";
  project.scenarios[1].vehiclePlans["UNIT-01"] = {
    transitions: [{ year: 2032, targetPresetId: "hybrid-van" }],
  };
  useProjectStore.setState(createProjectState(project));
});
afterEach(cleanup);

describe("Scenario comparison", () => {
  it("uses two persisted Scenarios, shared analysis results, and one comparison year", () => {
    render(<CompareWorkspace />);

    expect(screen.getByRole("combobox", { name: "Scenario for Plan A" })).toHaveValue("plan-a");
    expect(screen.getByRole("combobox", { name: "Scenario for Plan B" })).toHaveValue("plan-b");
    expect(screen.getByRole("heading", { name: "Gradual transition" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Early transition" })).toBeInTheDocument();

    const simulation = simulateProject(project);
    const formatCurrency = new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: project.analysis.currency,
      maximumFractionDigits: 0,
    });
    expect(within(screen.getByRole("group", { name: "Plan A results" }))
      .getByText(formatCurrency.format(simulation.scenarios["plan-a"].totals.tco))).toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "Plan B results" }))
      .getByText(formatCurrency.format(simulation.scenarios["plan-b"].totals.tco))).toBeInTheDocument();

    const slider = screen.getByRole("slider", { name: "Comparison year" });
    fireEvent.change(slider, { target: { value: "2031" } });
    expect(screen.getByTestId("comparison-viewport-plan-a")).toHaveAttribute("data-year", "2031");
    expect(screen.getByTestId("comparison-viewport-plan-b")).toHaveAttribute("data-year", "2031");
    expect(useProjectStore.getState().runtime.document).toEqual(project);
  });

  it("uses the same multi-transition state for comparison metrics and both selected-year viewports", () => {
    project.scenarios[0].vehiclePlans["UNIT-01"] = {
      transitions: [
        { year: 2028, targetPresetId: "hybrid-van" },
        { year: 2030, targetPresetId: "electric-van" },
        { year: 2032, targetPresetId: "diesel-van" },
      ],
    };
    project.scenarios[1].vehiclePlans["UNIT-01"] = {
      transitions: [
        { year: 2029, targetPresetId: "electric-van" },
        { year: 2031, targetPresetId: "hybrid-van" },
        { year: 2033, targetPresetId: "diesel-van" },
      ],
    };
    useProjectStore.setState(createProjectState(project));
    render(<CompareWorkspace />);

    fireEvent.change(screen.getByRole("slider", { name: "Comparison year" }), { target: { value: "2031" } });

    const simulation = simulateProject(project);
    const number = new Intl.NumberFormat("en-SG", { maximumFractionDigits: 0 });
    for (const scenarioId of ["plan-a", "plan-b"]) {
      const group = within(screen.getByRole("group", { name: `Plan ${scenarioId === "plan-a" ? "A" : "B"} results` }));
      const annual = simulation.scenarios[scenarioId].annual.find((entry) => entry.year === 2031)!;
      expect(group.getByText(`${number.format(annual.emissionsKgCo2e)} kg CO₂e`)).toBeInTheDocument();
      expect(group.getByText(new Intl.NumberFormat("en-SG", {
        style: "currency", currency: project.analysis.currency, maximumFractionDigits: 0,
      }).format(annual.netCashCost))).toBeInTheDocument();
    }
    expect(screen.getByTestId("comparison-viewport-plan-a")).toHaveAttribute("data-year", "2031");
    expect(screen.getByTestId("comparison-viewport-plan-b")).toHaveAttribute("data-year", "2031");
    expect(within(screen.getByRole("group", { name: "Plan A results" })).getByText("2031 transitions").parentElement)
      .toHaveTextContent("0");
    expect(within(screen.getByRole("group", { name: "Plan B results" })).getByText("2031 transitions").parentElement)
      .toHaveTextContent("1");
  });

  it("edits one Scenario's transition while preserving the other Scenario and shared Project data", async () => {
    const user = userEvent.setup();
    render(<CompareWorkspace />);

    await user.click(screen.getByRole("button", { name: "Edit Gradual transition decisions" }));
    await user.selectOptions(screen.getByRole("combobox", {
      name: "Target preset for Gradual transition / UNIT-01 transition in 2030",
    }), "hybrid-van");
    await user.selectOptions(screen.getByRole("combobox", {
      name: "Year for Gradual transition / UNIT-01 transition 2030",
    }), "2031");

    const changed = useProjectStore.getState().runtime.document;
    expect(changed.scenarios.find((scenario) => scenario.id === "plan-a")?.vehiclePlans["UNIT-01"].transitions)
      .toEqual([{ year: 2031, targetPresetId: "hybrid-van" }]);
    expect(changed.scenarios.find((scenario) => scenario.id === "plan-b")?.vehiclePlans["UNIT-01"].transitions)
      .toEqual([{ year: 2032, targetPresetId: "hybrid-van" }]);
    expect(changed.activeScenarioId).toBe("plan-a");
    expect(changed.environment).toEqual(project.environment);
    expect(changed.vehiclePresets).toEqual(project.vehiclePresets);
    expect(changed.analysis).toEqual(project.analysis);
  });

  it("edits Plan B decisions without replacing Plan A", async () => {
    const user = userEvent.setup();
    render(<CompareWorkspace />);

    await user.click(screen.getByRole("button", { name: "Edit Early transition decisions" }));
    await user.selectOptions(screen.getByRole("combobox", {
      name: "Target preset for Early transition / UNIT-01 transition in 2032",
    }), "electric-van");
    await user.selectOptions(screen.getByRole("combobox", {
      name: "Year for Early transition / UNIT-01 transition 2032",
    }), "2033");

    const changed = useProjectStore.getState().runtime.document;
    expect(changed.scenarios.find((scenario) => scenario.id === "plan-a")?.vehiclePlans["UNIT-01"].transitions)
      .toEqual([{ year: 2030, targetPresetId: "electric-van" }]);
    expect(changed.scenarios.find((scenario) => scenario.id === "plan-b")?.vehiclePlans["UNIT-01"].transitions)
      .toEqual([{ year: 2033, targetPresetId: "electric-van" }]);
    expect(changed.activeScenarioId).toBe("plan-a");
    expect(changed.environment).toEqual(project.environment);
    expect(changed.analysis).toEqual(project.analysis);
  });

  it("keeps comparison Scenario choices in runtime state", async () => {
    const user = userEvent.setup();
    project.scenarios.push({ id: "plan-c", name: "Custom scenario", vehiclePlans: {} });
    useProjectStore.setState(createProjectState(project));
    render(<CompareWorkspace />);
    const historyBefore = useProjectStore.getState().runtime.history.past.length;

    await user.selectOptions(screen.getByRole("combobox", { name: "Scenario for Plan A" }), "plan-c");

    expect(screen.getByRole("heading", { name: "Custom scenario" })).toBeInTheDocument();
    expect(screen.getByTestId("comparison-viewport-plan-c")).toBeInTheDocument();
    expect(useProjectStore.getState().runtime.document.activeScenarioId).toBe("plan-a");
    expect(useProjectStore.getState().runtime.document.scenarios).toEqual(project.scenarios);
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(historyBefore);
    expect((screen.getByRole("slider", { name: "Comparison year" }) as HTMLInputElement).value).toBe("2026");
  });

  it("recalculates both displayed plans when the shared Analysis Settings change", () => {
    render(<CompareWorkspace />);
    const formatCurrency = new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: project.analysis.currency,
      maximumFractionDigits: 0,
    });
    const initialA = formatCurrency.format(simulateProject(project).scenarios["plan-a"].totals.tco);
    const initialB = formatCurrency.format(simulateProject(project).scenarios["plan-b"].totals.tco);

    act(() => useProjectStore.getState().updateAnalysis({ fuelPricePerLitre: 4.5 }));

    const recalculated = simulateProject(useProjectStore.getState().runtime.document);
    const resultsA = within(screen.getByRole("group", { name: "Plan A results" }));
    const resultsB = within(screen.getByRole("group", { name: "Plan B results" }));
    expect(resultsA.getByText(formatCurrency.format(recalculated.scenarios["plan-a"].totals.tco))).toBeInTheDocument();
    expect(resultsB.getByText(formatCurrency.format(recalculated.scenarios["plan-b"].totals.tco))).toBeInTheDocument();
    expect(formatCurrency.format(recalculated.scenarios["plan-a"].totals.tco)).not.toBe(initialA);
    expect(formatCurrency.format(recalculated.scenarios["plan-b"].totals.tco)).not.toBe(initialB);
    expect(useProjectStore.getState().runtime.document.scenarios).toEqual(project.scenarios);
  });

  it("reports calculated but unreached payback separately from unavailable results", () => {
    project.analysis.yearCount = 1;
    project.vehiclePresets = project.vehiclePresets.map((preset) => preset.id === "electric-van"
      ? { ...preset, purchaseCost: 1_000_000 }
      : preset);
    for (const scenario of project.scenarios) {
      scenario.vehiclePlans["UNIT-01"] = { transitions: [{ year: 2026, targetPresetId: "electric-van" }] };
    }
    expect(simulateProject(project).scenarios["plan-a"].paybackYear).toBeNull();
    useProjectStore.setState(createProjectState(project));

    render(<CompareWorkspace />);

    expect(screen.getByText("Not reached in either Scenario")).toBeInTheDocument();
    expect(screen.queryByText("Unavailable")).not.toBeInTheDocument();
  });

  it("shows the available Scenario and recovers when one of the compared Scenarios is deleted", () => {
    const document = createProjectFixture();
    document.scenarios = [document.scenarios[0]];
    document.activeScenarioId = "plan-a";
    project = document;
    useProjectStore.setState(createProjectState(project));
    const { rerender } = render(<CompareWorkspace />);

    expect(screen.getByRole("combobox", { name: "Scenario for Plan A" })).toHaveValue("plan-a");
    expect(screen.getByRole("combobox", { name: "Scenario for Plan B" })).toBeDisabled();
    expect(screen.getByText("This Project has one Scenario. Create or duplicate another Scenario in Plan / Depot to compare alternatives.")).toBeInTheDocument();

    act(() => useProjectStore.getState().createScenario());
    rerender(<CompareWorkspace />);
    expect(screen.getByRole("combobox", { name: "Scenario for Plan B" })).not.toHaveValue("");

    const selectedPlanA = (screen.getByRole("combobox", { name: "Scenario for Plan A" }) as HTMLSelectElement).value;
    const scenarioAId = useProjectStore.getState().runtime.document.scenarios[0].id;
    expect(selectedPlanA).toBe(scenarioAId);
    act(() => useProjectStore.getState().deleteScenario(scenarioAId));
    rerender(<CompareWorkspace />);

    const remainingIds = useProjectStore.getState().runtime.document.scenarios.map((scenario) => scenario.id);
    expect(remainingIds).toHaveLength(1);
    expect(screen.getByRole("combobox", { name: "Scenario for Plan A" })).toHaveValue(remainingIds[0]);
    expect(screen.getByRole("combobox", { name: "Scenario for Plan B" })).toBeDisabled();
  });
});
