import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createProjectFixture } from "../domain/projectFixture";
import { createProjectState, useProjectStore } from "../state/projectStore";
import { FleetManagementPanel } from "./FleetManagementPanel";

afterEach(cleanup);
beforeEach(() => useProjectStore.setState(createProjectState(createProjectFixture())));

describe("Fleet Management", () => {
  it("uses shared typed Vehicle selection without creating a history entry", async () => {
    const user = userEvent.setup();
    render(<FleetManagementPanel />);

    await user.click(screen.getByRole("button", { name: "Select City Delivery Van in viewport" }));

    expect(useProjectStore.getState().runtime.editor.selection).toEqual({ kind: "vehicle", id: "UNIT-01" });
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(0);
  });

  it("reflects viewport selection in Fleet Management and preserves it across Scenario and year changes", () => {
    render(<FleetManagementPanel />);
    const vehicleButton = screen.getByRole("button", { name: "Select City Delivery Van in viewport" });

    act(() => useProjectStore.getState().selectProjectEntity({ kind: "vehicle", id: "UNIT-01" }));
    expect(vehicleButton).toHaveAttribute("aria-pressed", "true");

    act(() => {
      useProjectStore.getState().selectScenario("plan-b");
      useProjectStore.getState().setSelectedYear(2031);
      useProjectStore.getState().updateVehicle("UNIT-01", { baselinePresetId: "hybrid-van" });
    });

    expect(useProjectStore.getState().runtime.editor.selection).toEqual({ kind: "vehicle", id: "UNIT-01" });
    expect(vehicleButton).toHaveAttribute("aria-pressed", "true");
  });

  it("commits operational and ownership edits as undoable Project changes", () => {
    render(<FleetManagementPanel />);
    fireEvent.click(screen.getAllByRole("button", { name: "Edit vehicle inputs" })[0]);
    const distance = screen.getByRole("spinbutton", { name: "Annual distance (km)" });
    fireEvent.focus(distance);
    fireEvent.change(distance, { target: { value: "42000" } });
    fireEvent.blur(distance);

    expect(useProjectStore.getState().runtime.document.environment.vehicles[0].annualKm).toBe(42_000);
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(1);
    useProjectStore.getState().undo();
    expect(useProjectStore.getState().runtime.document.environment.vehicles[0].annualKm).toBe(28_000);

    fireEvent.change(screen.getByRole("combobox", { name: "Current ownership" }), { target: { value: "leased" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Annual lease payment" }), { target: { value: "1200" } });
    fireEvent.blur(screen.getByRole("spinbutton", { name: "Annual lease payment" }));
    expect(useProjectStore.getState().runtime.document.environment.vehicles[0].currentHolding).toEqual({
      kind: "leased", annualPayment: 1200, exitFee: 0,
    });
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(2);
  });

  it("keeps invalid utilisation drafts out of the Project document", () => {
    render(<FleetManagementPanel />);
    fireEvent.click(screen.getAllByRole("button", { name: "Edit vehicle inputs" })[0]);
    const utilisation = screen.getByRole("spinbutton", { name: "Utilisation (%)" });
    fireEvent.focus(utilisation);
    fireEvent.change(utilisation, { target: { value: "150" } });

    expect(useProjectStore.getState().runtime.document.environment.vehicles[0].utilisation).toBe(0.85);
    expect(utilisation).toHaveValue(150);
    fireEvent.blur(utilisation);
    expect(utilisation).toHaveValue(85);
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(0);
  });

  it("edits one transition in the initial form without dropping later Project transitions", () => {
    useProjectStore.getState().replaceVehicleTransitions("plan-a", "UNIT-01", [
      { year: 2029, targetPresetId: "electric-van" },
      { year: 2032, targetPresetId: "hybrid-van" },
    ]);
    render(<FleetManagementPanel />);

    fireEvent.change(screen.getByRole("combobox", { name: "Year to change for UNIT-01" }), { target: { value: "2030" } });

    expect(useProjectStore.getState().runtime.document.scenarios[0].vehiclePlans["UNIT-01"].transitions).toEqual([
      { year: 2030, targetPresetId: "electric-van" },
      { year: 2032, targetPresetId: "hybrid-van" },
    ]);
  });
});
