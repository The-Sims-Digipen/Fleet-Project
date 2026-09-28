import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createProjectFixture } from "../domain/projectFixture";
import { createProjectState, useProjectStore } from "../state/projectStore";
import { SimulationSettings } from "./SimulationSettings";

afterEach(cleanup);
beforeEach(() => useProjectStore.setState(createProjectState(createProjectFixture())));

describe("Shared Analysis Settings", () => {
  it("keeps invalid numeric drafts local and preserves the last Project value", () => {
    render(<SimulationSettings />);
    const fuelPrice = screen.getByRole("spinbutton", { name: "Diesel / fuel price (per litre)" });
    fireEvent.focus(fuelPrice);
    fireEvent.change(fuelPrice, { target: { value: "-1" } });

    expect(fuelPrice).toHaveValue(-1);
    expect(useProjectStore.getState().runtime.document.analysis.fuelPricePerLitre).toBe(2.15);
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(0);

    fireEvent.blur(fuelPrice);
    expect(fuelPrice).toHaveValue(2.15);
    expect(useProjectStore.getState().runtime.document.analysis.fuelPricePerLitre).toBe(2.15);
  });

  it("commits a shared price through the Project command and one Undo entry", () => {
    render(<SimulationSettings />);
    const fuelPrice = screen.getByRole("spinbutton", { name: "Diesel / fuel price (per litre)" });
    fireEvent.focus(fuelPrice);
    fireEvent.change(fuelPrice, { target: { value: "3.25" } });
    fireEvent.blur(fuelPrice);

    expect(useProjectStore.getState().runtime.document.analysis.fuelPricePerLitre).toBe(3.25);
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(1);
    useProjectStore.getState().undo();
    expect(useProjectStore.getState().runtime.document.analysis.fuelPricePerLitre).toBe(2.15);
  });
});
