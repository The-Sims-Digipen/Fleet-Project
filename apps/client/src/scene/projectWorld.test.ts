import { describe, expect, it } from "vitest";

import { addVehicleTransition } from "../domain/project";
import { createProjectFixture } from "../domain/projectFixture";
import { createProjectWorld, worldObjectReferenceKey } from "./projectWorld";

describe("Project world projection", () => {
  it("projects typed Depot and Vehicle views from authoritative transforms", () => {
    const project = createProjectFixture();
    const world = createProjectWorld(project, project.analysis.startYear);

    expect(world.map((object) => object.reference)).toEqual([
      { kind: "depot", id: project.environment.depot.id },
      { kind: "vehicle", id: "UNIT-01" },
    ]);
    expect(world.map((object) => object.name)).toEqual(["Default depot", "City Delivery Van"]);
    expect(world[0].transform).toEqual(project.environment.depot.transform);
    expect(world[1].transform).toEqual(project.environment.vehicles[0].transform);
    expect(world[0].transform).not.toBe(project.environment.depot.transform);
    expect(world[1].transform).not.toBe(project.environment.vehicles[0].transform);
    expect(world[0].model.definitionId).toBe("depot");
    expect(world[1].model).toEqual({ definitionId: "van", presetId: "diesel-van" });
    expect(world[0]).not.toHaveProperty("id");
  });

  it("resolves effective model and appearance from the active Scenario and selected year", () => {
    const project = createProjectFixture();
    project.scenarios[1].vehiclePlans["UNIT-01"] = {
      transitions: [{ year: 2030, targetPresetId: "electric-van" }],
    };
    project.activeScenarioId = "plan-b";

    const before = createProjectWorld(project, 2029)[1];
    const after = createProjectWorld(project, 2030)[1];

    expect(before.model).toEqual({ definitionId: "van", presetId: "diesel-van" });
    expect(before.appearance.tint).not.toBe("#39ff14");
    expect(after.model).toEqual({ definitionId: "van", presetId: "electric-van" });
    expect(after.appearance.tint).toBe("#39ff14");

    const changedScenario = addVehicleTransition(
      createProjectFixture(),
      { scenarioId: "plan-a", vehicleId: "UNIT-01" },
      { year: 2030, targetPresetId: "electric-van" },
    );
    changedScenario.activeScenarioId = "plan-a";
    expect(createProjectWorld(changedScenario, 2030)[1]).toMatchObject({
      model: { presetId: "electric-van" },
      appearance: { tint: "#39ff14" },
    });
  });

  it("keeps generic Vehicles visible and distinguishes same-ID typed references", () => {
    const project = createProjectFixture();
    project.environment.vehicles[0].baselinePresetId = null;
    project.environment.depot.id = "UNIT-01";
    const world = createProjectWorld(project, project.analysis.startYear);

    expect(world[1]).toMatchObject({
      reference: { kind: "vehicle", id: "UNIT-01" },
      model: { definitionId: "van", presetId: null },
      appearance: { tint: "#87928f" },
    });
    expect(worldObjectReferenceKey(world[0].reference)).not.toBe(worldObjectReferenceKey(world[1].reference));
  });
});
