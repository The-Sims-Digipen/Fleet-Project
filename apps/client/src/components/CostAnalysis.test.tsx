import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createProjectFixture } from "../domain/projectFixture";
import { createProjectState, useProjectStore } from "../state/projectStore";
import { CostAnalysis } from "./CostAnalysis";

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
});
