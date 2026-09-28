import { createMockAnalysis, createMockFleet, createMockPresets } from "../domain/mockProject";
import { createProjectDocument } from "../domain/projectDocument";
import { createScenarioDocument } from "../domain/scenario";
import { createDefaultProjectScene } from "../scene/defaultProjectScene";
import type { WorkspaceRecord } from "./types";

export function createSampleProjects(): WorkspaceRecord[] {
  const timestamp = "2026-09-10T09:00:00.000Z";
  const projectId = "b9b840a3-9a17-40e9-979b-e9682843eafa";
  const project = {
    id: projectId, name: "Sample depot transition", revision: 1,
    createdAt: timestamp, updatedAt: timestamp, document: createProjectDocument(createMockPresets(), createMockFleet(), createMockAnalysis(), createDefaultProjectScene()),
  };
  // Two plans over the same fleet, so switching scenario visibly changes the
  // effective year state without either plan touching the other.
  const scenarios = [
    {
      id: "63e41b98-588a-4bc7-a974-4ff8fcdbeb94", projectId, name: "Plan A · gradual", position: 0, revision: 1, createdAt: timestamp, updatedAt: timestamp,
      document: createScenarioDocument({
        "UNIT-01": { transitionYear: 2029, targetPresetId: "electric-van" },
        "UNIT-02": { transitionYear: 2032, targetPresetId: "electric-box-truck" },
        "UNIT-05": { transitionYear: 2031, targetPresetId: "electric-van" },
      }),
    },
    {
      id: "f5fd6ce9-a8f9-4d91-ad38-b22880658134", projectId, name: "Plan B · fast", position: 1, revision: 1, createdAt: timestamp, updatedAt: timestamp,
      document: createScenarioDocument({
        "UNIT-01": { transitionYear: 2026, targetPresetId: "electric-van" },
        "UNIT-02": { transitionYear: 2027, targetPresetId: "electric-box-truck" },
        "UNIT-04": { transitionYear: 2026, targetPresetId: "electric-van" },
        "UNIT-05": { transitionYear: 2027, targetPresetId: "electric-van" },
        "UNIT-06": { transitionYear: 2028, targetPresetId: "electric-box-truck" },
      }),
    },
  ];
  return [{ project, scenarios }];
}
