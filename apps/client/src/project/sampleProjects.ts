import { createMockAnalysis, createMockFleet, createMockPresets } from "../domain/mockProject";
import { projectV5FromLegacy } from "../domain/projectV5Compatibility";
import { createScenarioDocument } from "../domain/scenario";
import { createDefaultProjectScene } from "../scene/defaultProjectScene";
import type { AggregateProjectRecord, WorkspaceScenario } from "./types";

export function createSampleProjects(): AggregateProjectRecord[] {
  const timestamp = "2026-09-10T09:00:00.000Z";
  const projectId = "b9b840a3-9a17-40e9-979b-e9682843eafa";
  const scenarios: WorkspaceScenario[] = [
    {
      id: "63e41b98-588a-4bc7-a974-4ff8fcdbeb94", projectId, name: "Plan A · gradual", position: 0, revision: 1,
      document: createScenarioDocument({
        "UNIT-01": { transitionYear: 2029, targetPresetId: "electric-van" },
        "UNIT-02": { transitionYear: 2032, targetPresetId: "electric-box-truck" },
        "UNIT-05": { transitionYear: 2031, targetPresetId: "electric-van" },
      }),
    },
    {
      id: "f5fd6ce9-a8f9-4d91-ad38-b22880658134", projectId, name: "Plan B · fast", position: 1, revision: 1,
      document: createScenarioDocument({
        "UNIT-01": { transitionYear: 2026, targetPresetId: "electric-van" },
        "UNIT-02": { transitionYear: 2027, targetPresetId: "electric-box-truck" },
        "UNIT-04": { transitionYear: 2026, targetPresetId: "electric-van" },
        "UNIT-05": { transitionYear: 2027, targetPresetId: "electric-van" },
        "UNIT-06": { transitionYear: 2028, targetPresetId: "electric-box-truck" },
      }),
    },
  ];
  const document = projectV5FromLegacy({
    id: projectId,
    name: "Sample depot transition",
    scene: createDefaultProjectScene(),
    presets: createMockPresets(),
    fleet: createMockFleet(),
    analysis: createMockAnalysis(),
    scenarios,
    activeScenarioId: scenarios[0].id,
  });
  return [{ document, revision: 1, createdAt: timestamp, updatedAt: timestamp }];
}
