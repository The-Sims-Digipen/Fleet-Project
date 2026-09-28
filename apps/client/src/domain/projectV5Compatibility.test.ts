import { describe, expect, it } from "vitest";

import { normalizeProjectV5 } from "./projectV5";
import { legacyProjectView, mergeLegacyProjectData } from "./projectV5Compatibility";
import { createProjectV5Fixture } from "./projectV5Fixture";

describe("version 5 compatibility bridge", () => {
  it("preserves v5-only transforms and shared settings while applying legacy feature edits", () => {
    const document = normalizeProjectV5({
      ...createProjectV5Fixture(),
      environment: {
        ...createProjectV5Fixture().environment,
        vehicles: createProjectV5Fixture().environment.vehicles.map((vehicle) => ({
          ...vehicle,
          transform: { position: [19, 2, -4], rotation: [0, 1, 0], scale: [1.2, 1.2, 1.2] },
        })),
      },
      analysis: { ...createProjectV5Fixture().analysis, electricityPricePerKWh: 0.61, discountRate: 0.09 },
    });
    const legacy = legacyProjectView(document, 1);

    expect(mergeLegacyProjectData(document, legacy)).toEqual(document);

    legacy.fleet[0] = { ...legacy.fleet[0], annualKm: 42_000 };
    legacy.analysis = { ...legacy.analysis, fuelPricePerLitre: 2.9 };
    const edited = mergeLegacyProjectData(document, legacy);
    expect(edited.environment.vehicles[0]).toMatchObject({
      annualKm: 42_000,
      transform: document.environment.vehicles[0].transform,
    });
    expect(edited.analysis).toMatchObject({ fuelPricePerLitre: 2.9, electricityPricePerKWh: 0.61, discountRate: 0.09 });
  });
});
