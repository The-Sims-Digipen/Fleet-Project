import { describe, expect, it } from "vitest";

import { addVehicleTransition } from "../domain/project";
import { createProjectFixture } from "../domain/projectFixture";
import { simulateProject } from "../domain/simulation";
import { createProjectWorld, projectEntityReferenceKey, resolveProjectWorldSelection } from "./projectWorld";

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
    expect(world[0].modelId).toBe("depot");
    expect(world[1].modelId).toBe("van");
    expect(world[1].tint).toBe("#ffffff");
    expect(world[0]).not.toHaveProperty("id");
  });

  it("resolves effective model and derived tint from the active Scenario and selected year", () => {
    const project = createProjectFixture();
    project.scenarios[1].vehiclePlans["UNIT-01"] = {
      transitions: [{ year: 2030, targetPresetId: "electric-van" }],
    };
    project.activeScenarioId = "plan-b";

    const before = createProjectWorld(project, 2029)[1];
    const after = createProjectWorld(project, 2030)[1];

    expect(before.modelId).toBe("van");
    expect(before.tint).not.toBe("#39ff14");
    expect(after.modelId).toBe("van");
    expect(after.tint).toBe("#39ff14");

    const changedScenario = addVehicleTransition(
      createProjectFixture(),
      { scenarioId: "plan-a", vehicleId: "UNIT-01" },
      { year: 2030, targetPresetId: "electric-van" },
    );
    changedScenario.activeScenarioId = "plan-a";
    expect(createProjectWorld(changedScenario, 2030)[1]).toMatchObject({
      modelId: "van",
      tint: "#39ff14",
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
      createProjectWorld(project, year, scenarioId)[1].tint;
    const analytics = simulateProject(project);
    const fuelFor = (scenarioId: string, year: number) =>
      analytics.scenarios[scenarioId].annual.find((entry) => entry.year === year)?.fuelLitres;

    expect(modelFor("plan-a", 2029)).not.toBe("#39ff14");
    expect(modelFor("plan-a", 2030)).toBe("#39ff14");
    expect(modelFor("plan-a", 2031)).toBe("#39ff14");
    expect(fuelFor("plan-a", 2029)).toBe(2_660);
    expect(fuelFor("plan-a", 2030)).toBe(0);
    expect(fuelFor("plan-a", 2031)).toBe(0);
    expect(modelFor("plan-b", 2030)).not.toBe("#39ff14");
    expect(modelFor("plan-b", 2031)).toBe("#39ff14");
    expect(modelFor("plan-b", 2032)).toBe("#39ff14");
    expect(fuelFor("plan-b", 2030)).toBe(2_660);
    expect(fuelFor("plan-b", 2031)).toBe(1_512);
    expect(fuelFor("plan-b", 2032)).toBe(1_512);
  });

  it("keeps 3D preset projection and simulation aligned across multiple Vehicle transitions", () => {
    const project = createProjectFixture();
    project.scenarios[0].vehiclePlans["UNIT-01"] = {
      transitions: [
        { year: 2028, targetPresetId: "hybrid-van" },
        { year: 2030, targetPresetId: "electric-van" },
        { year: 2032, targetPresetId: "diesel-van" },
      ],
    };

    const simulation = simulateProject(project).scenarios["plan-a"];
    const stateAt = (year: number) => ({
      tint: createProjectWorld(project, year, "plan-a")[1].tint,
      fuel: simulation.annual.find((entry) => entry.year === year)?.fuelLitres,
      electricity: simulation.annual.find((entry) => entry.year === year)?.electricityKWh,
    });

    expect(stateAt(2027)).toMatchObject({ tint: "#ffffff", fuel: 2_660, electricity: 0 });
    expect(stateAt(2028)).toMatchObject({ tint: "#39ff14", fuel: 1_512, electricity: 3_733.333333333333 });
    expect(stateAt(2030)).toMatchObject({ tint: "#39ff14", fuel: 0, electricity: 6_844.444444444444 });
    expect(stateAt(2032)).toMatchObject({ tint: "#ffffff", fuel: 2_660, electricity: 0 });
  });

  it("keeps generic Vehicles visible and distinguishes same-ID typed references", () => {
    const project = createProjectFixture();
    project.environment.vehicles[0].baselinePresetId = null;
    project.environment.depot.id = "UNIT-01";
    const world = createProjectWorld(project, project.analysis.startYear);

    expect(world[1]).toMatchObject({
      reference: { kind: "vehicle", id: "UNIT-01" },
      modelId: "van",
      tint: "#87928f",
    });
    expect(projectEntityReferenceKey(world[0].reference)).not.toBe(projectEntityReferenceKey(world[1].reference));
  });

  it("routes typed Inspector selection through the world projection", () => {
    const project = createProjectFixture();
    const world = createProjectWorld(project, project.analysis.startYear);

    expect(resolveProjectWorldSelection(project, world, { kind: "depot", id: project.environment.depot.id })).toMatchObject({
      kind: "depot",
      entity: project.environment.depot,
      worldObject: world[0],
    });
    expect(resolveProjectWorldSelection(project, world, { kind: "vehicle", id: "UNIT-01" })).toMatchObject({
      kind: "vehicle",
      entity: project.environment.vehicles[0],
      worldObject: world[1],
    });
    expect(resolveProjectWorldSelection(project, world, { kind: "vehicle", id: "missing" })).toBeUndefined();
  });
});
