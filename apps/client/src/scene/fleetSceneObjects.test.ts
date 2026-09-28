import { describe, expect, it } from "vitest";

import { addVehicleTransition } from "../domain/project";
import { createProjectFixture } from "../domain/projectFixture";
import { createProjectSceneObjects } from "./fleetSceneObjects";

describe("Project scene projection", () => {
  it("renders the depot and vehicles from their authoritative transforms", () => {
    const project = createProjectFixture();
    const objects = createProjectSceneObjects(project, project.analysis.startYear);

    expect(objects.map((object) => object.id)).toEqual([project.environment.depot.id, "UNIT-01"]);
    expect(objects[0].transform).toEqual(project.environment.depot.transform);
    expect(objects[1].transform).toEqual(project.environment.vehicles[0].transform);
  });

  it("projects the active scenario's effective preset for the selected year", () => {
    const project = addVehicleTransition(
      createProjectFixture(),
      { scenarioId: "plan-a", vehicleId: "UNIT-01" },
      { year: 2030, targetPresetId: "electric-van" },
    );

    expect(createProjectSceneObjects(project, 2029)[1].appearance.tint).not.toBe("#39ff14");
    expect(createProjectSceneObjects(project, 2030)[1]).toMatchObject({ presetId: "electric-van", appearance: { tint: "#39ff14" } });
  });
});
