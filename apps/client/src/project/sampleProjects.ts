import { createMockAnalysis, createMockPresets, createMockVehicles } from "../domain/mockProject";
import { createProject, type ProjectScenario } from "../domain/project";
import type { ProjectRecord } from "./types";

export function createSampleProjects(): ProjectRecord[] {
  const timestamp = "2026-09-10T09:00:00.000Z";
  const projectId = "b9b840a3-9a17-40e9-979b-e9682843eafa";
  const scenarios: ProjectScenario[] = [
    {
      id: "63e41b98-588a-4bc7-a974-4ff8fcdbeb94",
      name: "Plan A · gradual",
      vehiclePlans: {
        "UNIT-01": { transitions: [{ year: 2029, targetPresetId: "electric-van" }] },
        "UNIT-02": { transitions: [{ year: 2032, targetPresetId: "electric-box-truck" }] },
        "UNIT-05": { transitions: [{ year: 2031, targetPresetId: "electric-van" }] },
      },
    },
    {
      id: "f5fd6ce9-a8f9-4d91-ad38-b22880658134",
      name: "Plan B · fast",
      vehiclePlans: {
        "UNIT-01": { transitions: [{ year: 2026, targetPresetId: "electric-van" }] },
        "UNIT-02": { transitions: [{ year: 2027, targetPresetId: "electric-box-truck" }] },
        "UNIT-04": { transitions: [{ year: 2026, targetPresetId: "electric-van" }] },
        "UNIT-05": { transitions: [{ year: 2027, targetPresetId: "electric-van" }] },
        "UNIT-06": { transitions: [{ year: 2028, targetPresetId: "electric-box-truck" }] },
      },
    },
  ];
  const document = createProject({
    id: projectId,
    name: "Sample depot transition",
    vehicles: createMockVehicles(),
    vehiclePresets: createMockPresets(),
    scenarios,
    activeScenarioId: scenarios[0].id,
    analysis: createMockAnalysis(),
  });
  return [{ document, revision: 1, createdAt: timestamp, updatedAt: timestamp }];
}
