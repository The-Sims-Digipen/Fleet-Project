import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createProjectFixture } from "../domain/projectFixture";
import { createSampleProjects } from "../project/sampleProjects";
import { createProjectState, useProjectStore } from "../state/projectStore";
import { FleetManagementPanel } from "./FleetManagementPanel";

afterEach(cleanup);
beforeEach(() => useProjectStore.setState(createProjectState(createProjectFixture())));

describe("Fleet Management", () => {
  it("shows one vehicle's fields below the compact list and edits the selected vehicle", async () => {
    useProjectStore.setState(createProjectState(createSampleProjects()[0].document));
    const user = userEvent.setup();
    render(<FleetManagementPanel />);

    expect(screen.getAllByRole("button", { name: /^Select / })).toHaveLength(6);
    expect(screen.getByRole("textbox", { name: "Vehicle name" })).toHaveValue("City Delivery Van");
    expect(screen.getAllByRole("spinbutton", { name: "Annual distance (km)" })).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Select Regional Hauler in viewport" }));
    expect(screen.getByRole("textbox", { name: "Vehicle name" })).toHaveValue("Regional Hauler");
    expect(screen.getByRole("button", { name: "Select Regional Hauler in viewport" })).toHaveAttribute("aria-pressed", "true");

    const distance = screen.getByRole("spinbutton", { name: "Annual distance (km)" });
    await user.click(distance);
    await user.keyboard("{Control>}a{/Control}42000{Enter}");

    const vehicles = useProjectStore.getState().runtime.document.environment.vehicles;
    expect(vehicles.find((vehicle) => vehicle.id === "UNIT-02")?.annualKm).toBe(42_000);
    expect(vehicles.find((vehicle) => vehicle.id === "UNIT-01")?.annualKm).toBe(28_000);
  });

  it("commits a pending edit when selecting another vehicle", async () => {
    useProjectStore.setState(createProjectState(createSampleProjects()[0].document));
    const user = userEvent.setup();
    render(<FleetManagementPanel />);
    await user.click(screen.getByRole("spinbutton", { name: "Annual distance (km)" }));
    await user.keyboard("{Control>}a{/Control}42000");
    await user.click(screen.getByRole("button", { name: "Select Regional Hauler in viewport" }));

    expect(useProjectStore.getState().runtime.history.activeEdit).toBeNull();
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(1);
    act(() => useProjectStore.getState().undo());
    expect(useProjectStore.getState().runtime.document.environment.vehicles[0].annualKm).toBe(28_000);
    expect(screen.getByRole("textbox", { name: "Vehicle name" })).toHaveValue("Regional Hauler");
  });

  it("replaces an initial zero distance and keeps the edit cancellable and undoable", async () => {
    const document = createProjectFixture();
    document.environment.vehicles[0].annualKm = 0;
    useProjectStore.setState(createProjectState(document));
    const user = userEvent.setup();
    render(<FleetManagementPanel />);
    const distance = screen.getByRole("spinbutton", { name: "Annual distance (km)" });

    await user.click(distance);
    await user.keyboard("123");
    expect(distance).toHaveDisplayValue("123");
    expect(useProjectStore.getState().runtime.document.environment.vehicles[0].annualKm).toBe(123);
    await user.keyboard("{Escape}");
    expect(distance).toHaveValue(0);
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(0);

    await user.click(distance);
    await user.keyboard("456{Enter}");
    expect(distance).toHaveDisplayValue("456");
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(1);
    act(() => useProjectStore.getState().undo());
    expect(distance).toHaveValue(0);
  });

  it("uses shared typed Vehicle selection without creating a history entry", async () => {
    const user = userEvent.setup();
    render(<FleetManagementPanel />);

    await user.click(screen.getByRole("button", { name: "Select City Delivery Van in viewport" }));

    expect(useProjectStore.getState().runtime.editor.selection).toEqual({ kind: "vehicle", id: "UNIT-01" });
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(0);
  });

  it("reflects viewport selection in Fleet Management and preserves it across Scenario and year changes", () => {
    useProjectStore.setState(createProjectState(createSampleProjects()[0].document));
    render(<FleetManagementPanel />);
    const vehicleButton = screen.getByRole("button", { name: "Select Regional Hauler in viewport" });

    act(() => useProjectStore.getState().selectProjectEntity({ kind: "vehicle", id: "UNIT-02" }));
    expect(vehicleButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("textbox", { name: "Vehicle name" })).toHaveValue("Regional Hauler");

    act(() => {
      useProjectStore.getState().selectScenario(useProjectStore.getState().runtime.document.scenarios[1].id);
      useProjectStore.getState().setPlanSelectedYear(2031);
      useProjectStore.getState().updateVehicle("UNIT-02", { baselinePresetId: "hybrid-van" });
    });

    expect(useProjectStore.getState().runtime.editor.selection).toEqual({ kind: "vehicle", id: "UNIT-02" });
    expect(vehicleButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("combobox", { name: "Baseline preset" })).toHaveValue("hybrid-van");
    expect(screen.getByRole("combobox", { name: "Year to change for UNIT-02" })).toHaveValue("2027");
  });

  it("commits operational and ownership edits as undoable Project changes", () => {
    render(<FleetManagementPanel />);
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

  it("selects newly added vehicles and removes their plans with undo support", async () => {
    const user = userEvent.setup();
    render(<FleetManagementPanel />);
    await user.click(screen.getByRole("button", { name: "Add vehicle" }));
    const state = useProjectStore.getState();
    const addedVehicle = state.runtime.document.environment.vehicles[1];
    expect(state.runtime.editor.selection).toEqual({ kind: "vehicle", id: addedVehicle.id });
    expect(screen.getByRole("textbox", { name: "Vehicle name" })).toHaveValue(addedVehicle.name);
    act(() => useProjectStore.getState().replaceVehicleTransitions("plan-a", addedVehicle.id, [
      { year: 2029, targetPresetId: "electric-van" },
    ]));

    await user.click(screen.getByRole("button", { name: `Delete ${addedVehicle.id}` }));
    expect(screen.getByRole("alert")).toHaveTextContent("Plan A");
    await user.click(screen.getByRole("button", { name: "Delete vehicle" }));

    expect(useProjectStore.getState().runtime.editor.selection).toBeNull();
    expect(useProjectStore.getState().runtime.document.scenarios[0].vehiclePlans[addedVehicle.id]).toBeUndefined();
    expect(screen.getByRole("textbox", { name: "Vehicle name" })).toHaveValue("City Delivery Van");
    act(() => useProjectStore.getState().undo());
    expect(useProjectStore.getState().runtime.document.environment.vehicles).toHaveLength(2);
    expect(useProjectStore.getState().runtime.document.scenarios[0].vehiclePlans[addedVehicle.id].transitions).toEqual([
      { year: 2029, targetPresetId: "electric-van" },
    ]);
  });

  it("renders an empty fleet and opens the first new vehicle's fields", async () => {
    useProjectStore.getState().deleteVehicle("UNIT-01");
    const user = userEvent.setup();
    render(<FleetManagementPanel />);
    expect(screen.getByText("No fleet vehicles yet. Add one to start planning.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Vehicle name" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add vehicle" }));
    expect(screen.getByRole("textbox", { name: "Vehicle name" })).toHaveValue(useProjectStore.getState().runtime.document.environment.vehicles[0].name);
  });
});
