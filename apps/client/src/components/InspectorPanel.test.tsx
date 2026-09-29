import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createProjectFixture } from "../domain/projectFixture";
import { DEFAULT_SIDEBAR_PANELS, useAppStore } from "../state/appStore";
import { createProjectState, useProjectStore } from "../state/projectStore";
import { InspectorPanel } from "./EditorPanels";

afterEach(cleanup);
beforeEach(() => {
  useProjectStore.setState(createProjectState(createProjectFixture()));
  useAppStore.setState({ sidebarPanels: { ...DEFAULT_SIDEBAR_PANELS, inspector: true } });
});

describe("development Inspector", () => {
  it("separates baseline fields, active Scenario transitions, and read-only effective state", () => {
    act(() => {
      useProjectStore.getState().replaceVehicleTransitions("plan-a", "UNIT-01", [
        { year: 2028, targetPresetId: "hybrid-van" },
      ]);
      useProjectStore.getState().replaceVehicleTransitions("plan-b", "UNIT-01", [
        { year: 2030, targetPresetId: "electric-van" },
      ]);
      useProjectStore.getState().selectScenario("plan-b");
      useProjectStore.getState().setSelectedYear(2030);
      useProjectStore.getState().selectObject({ kind: "vehicle", id: "UNIT-01" });
    });
    render(<InspectorPanel />);

    expect(screen.getByText("Baseline Vehicle fields")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Baseline preset" })).toHaveValue("diesel-van");
    expect(screen.getByText("Active Scenario transitions · Plan B")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Target preset for transition 1" })).toHaveValue("electric-van");
    const effectiveState = screen.getByLabelText("Effective Vehicle state");
    expect(effectiveState).toHaveTextContent("Read-only");
    expect(within(effectiveState).queryByRole("combobox")).not.toBeInTheDocument();
    expect(within(effectiveState).queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(within(effectiveState).getByText("Effective preset").parentElement).toHaveTextContent("Electric Delivery Van");
  });

  it("edits baseline fields and multiple active-Scenario transitions through Project history", () => {
    act(() => useProjectStore.getState().selectObject({ kind: "vehicle", id: "UNIT-01" }));
    render(<InspectorPanel />);

    const annualDistance = screen.getByRole("spinbutton", { name: "Annual distance (km)" });
    fireEvent.focus(annualDistance);
    fireEvent.change(annualDistance, { target: { value: "42000" } });
    fireEvent.blur(annualDistance);

    expect(useProjectStore.getState().runtime.document.environment.vehicles[0].annualKm).toBe(42_000);
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Add transition" }));
    fireEvent.click(screen.getByRole("button", { name: "Add transition" }));

    expect(useProjectStore.getState().runtime.document.scenarios[0].vehiclePlans["UNIT-01"].transitions).toEqual([
      { year: 2026, targetPresetId: "diesel-van" },
      { year: 2027, targetPresetId: "diesel-van" },
    ]);
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(3);

    useProjectStore.getState().undo();
    expect(useProjectStore.getState().runtime.document.scenarios[0].vehiclePlans["UNIT-01"].transitions).toEqual([
      { year: 2026, targetPresetId: "diesel-van" },
    ]);
  });

  it("keeps transition year drafts focused until one unique whole-year edit is committed", () => {
    act(() => {
      useProjectStore.getState().replaceVehicleTransitions("plan-a", "UNIT-01", [
        { year: 2029, targetPresetId: "electric-van" },
        { year: 2032, targetPresetId: "hybrid-van" },
      ]);
      useProjectStore.getState().selectObject({ kind: "vehicle", id: "UNIT-01" });
    });
    const historyLength = useProjectStore.getState().runtime.history.past.length;
    render(<InspectorPanel />);

    const year = screen.getByRole("spinbutton", { name: "Transition year 1" });
    act(() => year.focus());
    fireEvent.change(year, { target: { value: "2034" } });
    expect(year).toHaveFocus();
    expect(useProjectStore.getState().runtime.document.scenarios[0].vehiclePlans["UNIT-01"].transitions[0].year).toBe(2029);
    fireEvent.blur(year);

    expect(useProjectStore.getState().runtime.document.scenarios[0].vehiclePlans["UNIT-01"].transitions).toEqual([
      { year: 2032, targetPresetId: "hybrid-van" },
      { year: 2034, targetPresetId: "electric-van" },
    ]);
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(historyLength + 1);
  });

  it("discards a transition year draft when Escape is pressed", () => {
    act(() => {
      useProjectStore.getState().replaceVehicleTransitions("plan-a", "UNIT-01", [
        { year: 2029, targetPresetId: "electric-van" },
      ]);
      useProjectStore.getState().selectObject({ kind: "vehicle", id: "UNIT-01" });
    });
    const historyLength = useProjectStore.getState().runtime.history.past.length;
    render(<InspectorPanel />);

    const year = screen.getByRole("spinbutton", { name: "Transition year 1" });
    act(() => year.focus());
    fireEvent.change(year, { target: { value: "2034" } });
    fireEvent.keyDown(year, { key: "Escape" });

    expect(useProjectStore.getState().runtime.document.scenarios[0].vehiclePlans["UNIT-01"].transitions).toEqual([
      { year: 2029, targetPresetId: "electric-van" },
    ]);
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(historyLength);
  });

  it("rejects a duplicate transition year without changing the Scenario or history", () => {
    act(() => {
      useProjectStore.getState().replaceVehicleTransitions("plan-a", "UNIT-01", [
        { year: 2029, targetPresetId: "electric-van" },
        { year: 2032, targetPresetId: "hybrid-van" },
      ]);
      useProjectStore.getState().selectObject({ kind: "vehicle", id: "UNIT-01" });
    });
    const transitions = structuredClone(useProjectStore.getState().runtime.document.scenarios[0].vehiclePlans["UNIT-01"].transitions);
    const historyLength = useProjectStore.getState().runtime.history.past.length;
    render(<InspectorPanel />);

    const year = screen.getByRole("spinbutton", { name: "Transition year 1" });
    act(() => year.focus());
    fireEvent.change(year, { target: { value: "2032" } });
    fireEvent.blur(year);

    expect(screen.getByRole("alert")).toHaveTextContent("only one transition per year");
    expect(useProjectStore.getState().runtime.document.scenarios[0].vehiclePlans["UNIT-01"].transitions).toEqual(transitions);
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(historyLength);
  });
});
