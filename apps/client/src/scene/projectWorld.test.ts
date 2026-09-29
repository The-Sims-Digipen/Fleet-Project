import { describe, expect, it } from "vitest";

import { addVehicleTransition } from "../domain/project";
import { createProjectFixture } from "../domain/projectFixture";
import { simulateProject } from "../domain/simulation";
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

  it("projects each requested Scenario at its own before, at, and after transition years", () => {
    const project = createProjectFixture();
    project.scenarios[0].vehiclePlans["UNIT-01"] = {
      transitions: [{ year: 2030, targetPresetId: "electric-van" }],
    };
    project.scenarios[1].vehiclePlans["UNIT-01"] = {
      transitions: [{ year: 2031, targetPresetId: "hybrid-van" }],
    };
    project.activeScenarioId = "plan-b";

    const modelFor = (scenarioId: string, year: number) =>
      createProjectWorld(project, year, scenarioId)[1].model;
    const analytics = simulateProject(project);
    const fuelFor = (scenarioId: string, year: number) =>
      analytics.scenarios[scenarioId].annual.find((entry) => entry.year === year)?.fuelLitres;

    expect(modelFor("plan-a", 2029).presetId).toBe("diesel-van");
    expect(modelFor("plan-a", 2030).presetId).toBe("electric-van");
    expect(modelFor("plan-a", 2031).presetId).toBe("electric-van");
    expect(fuelFor("plan-a", 2029)).toBe(2_660);
    expect(fuelFor("plan-a", 2030)).toBe(0);
    expect(fuelFor("plan-a", 2031)).toBe(0);
    expect(modelFor("plan-b", 2030).presetId).toBe("diesel-van");
    expect(modelFor("plan-b", 2031).presetId).toBe("hybrid-van");
    expect(modelFor("plan-b", 2032).presetId).toBe("hybrid-van");
    expect(fuelFor("plan-b", 2030)).toBe(2_660);
    expect(fuelFor("plan-b", 2031)).toBe(1_512);
    expect(fuelFor("plan-b", 2032)).toBe(1_512);
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
