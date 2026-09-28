import { beforeEach, describe, expect, it } from "vitest";

import { createProjectFixture } from "../domain/projectFixture";
import { createPortableProject } from "../project/portableProject";
import { createMemoryProjectRepository } from "../project/repository";
import { createProjectState, setProjectRepository, useProjectStore } from "./projectStore";

const project = () => useProjectStore.getState();

beforeEach(() => {
  setProjectRepository(createMemoryProjectRepository());
  useProjectStore.setState(createProjectState(createProjectFixture()));
});

describe("Project store", () => {
  it("edits scenarios and transitions inside the canonical aggregate", () => {
    project().createScenario();
    const scenario = project().runtime.document.scenarios.at(-1)!;
    project().replaceVehicleTransitions(scenario.id, "UNIT-01", [{ year: 2030, targetPresetId: "electric-van" }]);

    expect(project().runtime.document.activeScenarioId).toBe(scenario.id);
    expect(project().runtime.document.scenarios.at(-1)?.vehiclePlans["UNIT-01"].transitions).toEqual([
      { year: 2030, targetPresetId: "electric-van" },
    ]);
  });

  it("uses one edit boundary and one history for every Project mutation", () => {
    project().beginEdit();
    project().updateVehicle("UNIT-01", { annualKm: 40_000 });
    project().updateVehicle("UNIT-01", { annualKm: 42_000 });
    project().commitEdit();

    expect(project().runtime.history.past).toHaveLength(1);
    expect(project().runtime.document.environment.vehicles[0].annualKm).toBe(42_000);
    project().undo();
    expect(project().runtime.document.environment.vehicles[0].annualKm).toBe(28_000);
    project().redo();
    expect(project().runtime.document.environment.vehicles[0].annualKm).toBe(42_000);
  });

  it("creates and deletes entities without leaving dangling references", () => {
    const vehicleId = project().createVehicle();
    expect(vehicleId).not.toBeNull();
    project().replaceVehicleTransitions("plan-a", vehicleId!, [{ year: 2028, targetPresetId: "electric-van" }]);
    project().deleteVehicle(vehicleId!);
    expect(project().runtime.document.environment.vehicles.some((vehicle) => vehicle.id === vehicleId)).toBe(false);
    expect(project().runtime.document.scenarios[0].vehiclePlans[vehicleId!]).toBeUndefined();

    expect(project().deletePreset("diesel-van")).toBe(false);
    project().updateVehicle("UNIT-01", { baselinePresetId: null });
    expect(project().deletePreset("diesel-van")).toBe(true);
  });

  it("persists and reopens the complete aggregate", async () => {
    project().renameProject("Saved project");
    await project().saveProject();
    const id = project().runtime.document.id;
    expect(project().runtime.record?.revision).toBe(1);

    project().renameProject("Unsaved rename");
    await project().openProject(id);
    expect(project().runtime.document.name).toBe("Saved project");
    expect(project().runtime.history.past).toHaveLength(0);
  });

  it("imports as a new Project identity", async () => {
    const source = createProjectFixture("source-project");
    await project().importProject(createPortableProject(source));

    expect(project().runtime.document.id).not.toBe(source.id);
    expect(project().runtime.document.name).toBe(source.name);
    expect(project().runtime.record?.revision).toBe(1);
  });
});
