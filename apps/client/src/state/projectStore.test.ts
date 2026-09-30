import { beforeEach, describe, expect, it, vi } from "vitest";

import { createProjectFixture } from "../domain/projectFixture";
import { DEFAULT_VEHICLE_SPAWN_TRANSFORMS } from "../domain/depotLayout";
import { simulateProject } from "../domain/simulation";
import { createPortableProject } from "../project/portableProject";
import { createMemoryProjectRepository } from "../project/repository";
import { DEFAULT_PROJECT_CAMERA } from "./projectRuntime";
import { createProjectState, setProjectRepository, useProjectStore } from "./projectStore";

const project = () => useProjectStore.getState();

beforeEach(() => {
  setProjectRepository(createMemoryProjectRepository());
  useProjectStore.setState(createProjectState(createProjectFixture()));
});

describe("Project store", () => {
  it("creates Projects when HTTP does not expose crypto.randomUUID", () => {
    vi.stubGlobal("crypto", { getRandomValues: crypto.getRandomValues.bind(crypto) });
    try {
      const state = createProjectState();
      expect(state.runtime.document.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("keeps viewport lighting in runtime editor state only", () => {
    const document = structuredClone(project().runtime.document);

    project().setLightIntensity(120);

    expect(project().runtime.editor.lightIntensity).toBe(100);
    expect(project().runtime.document).toEqual(document);
    expect(project().runtime.history.past).toHaveLength(0);

    project().setLightIntensity(-5);

    expect(project().runtime.editor.lightIntensity).toBe(0);
    expect(project().runtime.document).toEqual(document);
    expect(project().runtime.history.past).toHaveLength(0);
  });

  it("edits scenarios and transitions inside the canonical aggregate", () => {
    project().createScenario();
    const scenario = project().runtime.document.scenarios.at(-1)!;
    project().replaceVehicleTransitions(scenario.id, "UNIT-01", [{ year: 2030, targetPresetId: "electric-van" }]);

    expect(project().runtime.document.activeScenarioId).toBe(scenario.id);
    expect(project().runtime.document.scenarios.at(-1)?.vehiclePlans["UNIT-01"].transitions).toEqual([
      { year: 2030, targetPresetId: "electric-van" },
    ]);
  });

  it("keeps planned transitions outside the analysis window in the Project", () => {
    project().replaceVehicleTransitions("plan-a", "UNIT-01", [
      { year: 2040, targetPresetId: "electric-van" },
      { year: 2025, targetPresetId: "hybrid-van" },
    ]);

    expect(project().runtime.document.scenarios[0].vehiclePlans["UNIT-01"].transitions).toEqual([
      { year: 2025, targetPresetId: "hybrid-van" },
      { year: 2040, targetPresetId: "electric-van" },
    ]);
  });

  it("creates, duplicates, edits, and deletes Presets as undoable Project commands", () => {
    const createdId = project().createPreset();
    const created = project().runtime.document.vehiclePresets.find((preset) => preset.id === createdId)!;
    expect(project().runtime.history.past).toHaveLength(1);

    const duplicateId = project().duplicatePreset(createdId)!;
    expect(duplicateId).not.toBe(createdId);
    expect(project().runtime.document.vehiclePresets.find((preset) => preset.id === duplicateId)?.name).toBe(`${created.name} copy`);
    expect(project().runtime.history.past).toHaveLength(2);

    project().selectPreset(duplicateId);
    expect(project().runtime.history.past).toHaveLength(2);
    project().updatePreset(duplicateId, { name: "Custom electric van", purchaseCost: 28_000, maintenanceCostPerYear: 450 });
    expect(project().runtime.history.past).toHaveLength(3);
    expect(project().runtime.document.vehiclePresets.find((preset) => preset.id === duplicateId)).toMatchObject({
      name: "Custom electric van", purchaseCost: 28_000, maintenanceCostPerYear: 450,
    });

    project().undo();
    expect(project().runtime.document.vehiclePresets.find((preset) => preset.id === duplicateId)?.name).toBe(`${created.name} copy`);
    project().redo();
    expect(project().runtime.document.vehiclePresets.find((preset) => preset.id === duplicateId)?.purchaseCost).toBe(28_000);

    expect(project().deletePreset(duplicateId)).toBe(true);
    expect(project().runtime.document.vehiclePresets.some((preset) => preset.id === duplicateId)).toBe(false);
    project().undo();
    expect(project().runtime.document.vehiclePresets.some((preset) => preset.id === duplicateId)).toBe(true);
  });

  it("blocks referenced Preset deletion with Vehicle and Scenario details", () => {
    project().replaceVehicleTransitions("plan-a", "UNIT-01", [{ year: 2029, targetPresetId: "diesel-van" }]);

    expect(project().deletePreset("diesel-van")).toBe(false);
    expect(() => project().executeCommand({ type: "delete-vehicle-preset", presetId: "diesel-van" }))
      .toThrow(/Baseline for City Delivery Van.*Transition for City Delivery Van.*Plan A, 2029/);
    expect(project().runtime.document.vehiclePresets.some((preset) => preset.id === "diesel-van")).toBe(true);
  });

  it("round-trips edited Presets and active Scenario through save, reopen, export, and import", async () => {
    const presetId = project().createPreset();
    project().updatePreset(presetId, { name: "Regional hybrid", propulsion: "hybrid", litresPer100Km: 4.8, kWhPer100Km: 9.2, purchaseCost: 31_500 });
    project().updateAnalysis({ fuelPricePerLitre: 3.25, discountRate: 0.08 });
    project().selectScenario("plan-b");
    project().replaceVehicleTransitions("plan-b", "UNIT-01", [{ year: 2040, targetPresetId: presetId }]);
    const savedDocument = structuredClone(project().runtime.document);
    await project().saveProject();
    const projectId = project().runtime.document.id;
    const exportFile = project().exportProject();

    project().newProject("Temporary");
    await project().openProject(projectId);
    expect(project().runtime.document).toEqual(savedDocument);
    expect(project().runtime.document.activeScenarioId).toBe("plan-b");
    expect(project().runtime.document.scenarios[1].vehiclePlans["UNIT-01"].transitions).toEqual([{ year: 2040, targetPresetId: presetId }]);
    expect(project().runtime.document.analysis).toMatchObject({ fuelPricePerLitre: 3.25, discountRate: 0.08 });

    await project().importProject(exportFile);
    expect(project().runtime.document.id).not.toBe(projectId);
    expect(project().runtime.document.vehiclePresets.find((preset) => preset.id === presetId)).toMatchObject({
      name: "Regional hybrid", propulsion: "hybrid", litresPer100Km: 4.8, kWhPer100Km: 9.2, purchaseCost: 31_500,
    });
    expect(project().runtime.document.activeScenarioId).toBe("plan-b");
    expect(project().runtime.document.scenarios[1].vehiclePlans["UNIT-01"].transitions).toEqual([{ year: 2040, targetPresetId: presetId }]);
    expect(project().runtime.document.analysis).toMatchObject({ fuelPricePerLitre: 3.25, discountRate: 0.08 });
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

  it("copies the next free spawn transform and restores vehicle data without selection on Undo", () => {
    const first = project().createVehicle()!;
    const firstVehicle = project().runtime.document.environment.vehicles.find((vehicle) => vehicle.id === first)!;
    expect(firstVehicle.transform.position).toEqual([ -3.2, 0, -7 ]);
    const second = project().createVehicle()!;
    const secondVehicle = project().runtime.document.environment.vehicles.find((vehicle) => vehicle.id === second)!;
    expect(secondVehicle.transform.position).toEqual([ 0, 0, -7 ]);

    project().replaceVehicleTransitions("plan-a", first, [{ year: 2030, targetPresetId: "electric-van" }]);
    project().replaceVehicleTransitions("plan-b", first, [{ year: 2040, targetPresetId: "hybrid-van" }]);
    project().selectProjectEntity({ kind: "vehicle", id: first });
    project().deleteVehicle(first);
    expect(project().runtime.document.environment.vehicles.some((vehicle) => vehicle.id === first)).toBe(false);
    expect(project().runtime.document.scenarios.every((scenario) => scenario.vehiclePlans[first] === undefined)).toBe(true);
    expect(project().runtime.editor.selection).toBeNull();

    project().undo();
    expect(project().runtime.document.environment.vehicles.some((vehicle) => vehicle.id === first)).toBe(true);
    expect(project().runtime.document.scenarios.map((scenario) => scenario.vehiclePlans[first]?.transitions[0].targetPresetId))
      .toEqual(["electric-van", "hybrid-van"]);
    expect(project().runtime.editor.selection).toBeNull();
  });

  it("reuses a deleted spawn transform without storing a spawn-slot identity", () => {
    const createdId = project().createVehicle()!;
    const transform = project().runtime.document.environment.vehicles.find((vehicle) => vehicle.id === createdId)!.transform;
    project().deleteVehicle(createdId);
    const replacementId = project().createVehicle()!;

    expect(project().runtime.document.environment.vehicles.find((vehicle) => vehicle.id === replacementId)?.transform).toEqual(transform);
    expect("spawnSlotId" in project().runtime.document.environment.vehicles.find((vehicle) => vehicle.id === replacementId)!).toBe(false);
  });

  it("keeps a spawn position occupied when a Vehicle is rotated or scaled", () => {
    const firstId = project().createVehicle()!;
    const first = project().runtime.document.environment.vehicles.find((vehicle) => vehicle.id === firstId)!;
    project().setProjectEntityTransform({ kind: "vehicle", id: firstId }, {
      ...first.transform,
      rotation: [0, Math.PI / 2, 0],
      scale: [1.1, 1.1, 1.1],
    });

    const secondId = project().createVehicle()!;
    const second = project().runtime.document.environment.vehicles.find((vehicle) => vehicle.id === secondId)!;

    expect(second.transform.position).toEqual([0, 0, -7]);
  });

  it("keeps default spawn transforms and existing Vehicle transforms independent of Depot movement", () => {
    const spawnTransforms = structuredClone(DEFAULT_VEHICLE_SPAWN_TRANSFORMS);
    const vehicleTransforms = structuredClone(project().runtime.document.environment.vehicles.map((vehicle) => vehicle.transform));
    const depot = project().runtime.document.environment.depot;
    project().setProjectEntityTransform({ kind: "depot", id: depot.id }, {
      ...depot.transform,
      position: [120, 0, -40],
    });
    const createdId = project().createVehicle()!;

    expect(DEFAULT_VEHICLE_SPAWN_TRANSFORMS).toEqual(spawnTransforms);
    expect(project().runtime.document.environment.vehicles[0].transform).toEqual(vehicleTransforms[0]);
    expect(project().runtime.document.environment.vehicles.find((vehicle) => vehicle.id === createdId)?.transform)
      .toEqual(spawnTransforms[1]);
  });

  it("groups live typed transform updates into one Undo entry and restores a cancelled drag", () => {
    const reference = { kind: "vehicle" as const, id: "UNIT-01" };
    const startingTransform = structuredClone(project().runtime.document.environment.vehicles[0].transform);
    project().beginEdit();
    project().setProjectEntityTransform(reference, { ...startingTransform, position: [1, 2, 3] });
    project().setProjectEntityTransform(reference, { ...startingTransform, position: [4, 5, 6] });
    project().setProjectEntityTransform(reference, { ...startingTransform, position: [7, 8, 9] });
    project().commitEdit();

    expect(project().runtime.document.environment.vehicles[0].transform.position).toEqual([7, 8, 9]);
    expect(project().runtime.history.past).toHaveLength(1);
    project().undo();
    expect(project().runtime.document.environment.vehicles[0].transform).toEqual(startingTransform);

    project().beginEdit();
    project().setProjectEntityTransform(reference, { ...startingTransform, position: [10, 11, 12] });
    project().cancelEdit();
    expect(project().runtime.document.environment.vehicles[0].transform).toEqual(startingTransform);
    expect(project().runtime.history.activeEdit).toBeNull();
    expect(project().runtime.history.past).toHaveLength(0);
  });

  it("keeps typed selection identity when switching between Inspect and Gizmo modes", () => {
    const selection = { kind: "vehicle" as const, id: "UNIT-01" };
    project().selectProjectEntity(selection);
    project().setInteractionMode("gizmo");
    expect(project().runtime.editor.selection).toEqual(selection);
    project().setInteractionMode("inspect");
    expect(project().runtime.editor.selection).toEqual(selection);
  });

  it("duplicates Scenario plans independently and protects the final Scenario", () => {
    project().replaceVehicleTransitions("plan-a", "UNIT-01", [{ year: 2030, targetPresetId: "electric-van" }]);
    project().duplicateScenario("plan-a");
    const duplicate = project().runtime.document.scenarios.at(-1)!;

    expect(duplicate.vehiclePlans["UNIT-01"]).toEqual({ transitions: [{ year: 2030, targetPresetId: "electric-van" }] });
    project().replaceVehicleTransitions(duplicate.id, "UNIT-01", [{ year: 2034, targetPresetId: "hybrid-van" }]);
    expect(project().runtime.document.scenarios[0].vehiclePlans["UNIT-01"].transitions).toEqual([{ year: 2030, targetPresetId: "electric-van" }]);

    project().deleteScenario("plan-b");
    const remainingId = project().runtime.document.scenarios.find((scenario) => scenario.id !== duplicate.id)!.id;
    project().deleteScenario(remainingId);
    const count = project().runtime.document.scenarios.length;
    project().deleteScenario(duplicate.id);
    expect(project().runtime.document.scenarios).toHaveLength(count);
    expect(project().runtime.document.activeScenarioId).toBe(duplicate.id);
  });

  it("undoes active-Scenario changes and picks the deterministic survivor on deletion", () => {
    project().selectScenario("plan-b");
    expect(project().runtime.document.activeScenarioId).toBe("plan-b");
    project().undo();
    expect(project().runtime.document.activeScenarioId).toBe("plan-a");

    project().selectScenario("plan-b");
    project().deleteScenario("plan-b");
    expect(project().runtime.document.activeScenarioId).toBe("plan-a");
    project().undo();
    expect(project().runtime.document.activeScenarioId).toBe("plan-b");
    expect(project().runtime.document.scenarios.map((scenario) => scenario.id)).toEqual(["plan-a", "plan-b"]);
  });

  it("recomputes every Scenario with shared assumptions without editing their plans", () => {
    project().replaceVehicleTransitions("plan-a", "UNIT-01", [{ year: 2028, targetPresetId: "electric-van" }]);
    project().replaceVehicleTransitions("plan-b", "UNIT-01", [{ year: 2032, targetPresetId: "hybrid-van" }]);
    const plansBefore = structuredClone(project().runtime.document.scenarios.map((scenario) => scenario.vehiclePlans));
    const before = simulateProject(project().runtime.document);

    project().updateAnalysis({ fuelPricePerLitre: 3.25, electricityPricePerKWh: 0.4 });
    const after = simulateProject(project().runtime.document);

    expect(after.scenarios["plan-a"].totals.tco).not.toBe(before.scenarios["plan-a"].totals.tco);
    expect(after.scenarios["plan-b"].totals.tco).not.toBe(before.scenarios["plan-b"].totals.tco);
    expect(project().runtime.document.scenarios.map((scenario) => scenario.vehiclePlans)).toEqual(plansBefore);
    expect(project().runtime.history.past).toHaveLength(3);
    project().undo();
    expect(project().runtime.document.analysis.fuelPricePerLitre).toBe(2.15);
  });

  it("clamps the runtime year when shared analysis settings change", () => {
    project().setPlanSelectedYear(2034);
    project().setCompareSelectedYear(2033);
    project().updateAnalysis({ startYear: 2030, yearCount: 2 });

    expect(project().runtime.editor.plan.selectedYear).toBe(2031);
    expect(project().runtime.editor.compare.selectedYear).toBe(2031);
  });

  it("keeps Plan and Compare navigation independent and outside Project history", () => {
    project().setPlanSelectedYear(2029);
    project().setPlanPlaying(true);
    project().setCompareScenario("A", "plan-b");
    project().setCompareSelectedYear(2031);
    project().setComparePlaying(true);

    expect(project().runtime.editor.plan).toEqual({ selectedYear: 2029, playing: true });
    expect(project().runtime.editor.compare).toEqual({
      scenarioAId: "plan-b",
      scenarioBId: "plan-a",
      selectedYear: 2031,
      playing: true,
    });
    expect(project().runtime.document.activeScenarioId).toBe("plan-a");
    expect(project().runtime.history.past).toHaveLength(0);
  });

  it("updates and resets the runtime camera without adding history", () => {
    project().setCamera({ position: [2, 3, 4], target: [1, 0, -1] });

    expect(project().runtime.editor.camera).toEqual({ position: [2, 3, 4], target: [1, 0, -1] });
    expect(project().runtime.history.past).toHaveLength(0);
    project().resetCamera();
    expect(project().runtime.editor.camera).toEqual(DEFAULT_PROJECT_CAMERA);
    expect(project().runtime.editor.cameraRevision).toBe(1);
    expect(project().runtime.history.past).toHaveLength(0);
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
