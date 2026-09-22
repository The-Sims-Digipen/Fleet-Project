import { createMockAnalysis, createMockFleet, createMockPresets } from "../domain/mockProject";
import { createProjectDocument } from "../domain/projectDocument";
import { createScenarioDocument } from "../domain/scenario";
import { createObject } from "../scene/catalog";
import type { SceneDocument } from "../scene/types";
import type { WorkspaceRecord } from "./types";

function sampleWorld(): SceneDocument {
  return {
    version: 3,
    light: 65,
    objects: Array.from({ length: 4 }, (_, index) => {
      const van = createObject("van", `sample-van-${index + 1}`)!;
      van.name = `Van ${index + 1}`;
      van.transform.position = [(index - 1.5) * 3, 0, 0];
      return van;
    }),
  };
}

export function createSampleProjects(): WorkspaceRecord[] {
  const timestamp = "2026-09-10T09:00:00.000Z";
  const world = { id: "a7dc705f-e619-4c9c-a3da-70770d63f708", name: "Sample depot", revision: 1, createdAt: timestamp, updatedAt: timestamp, document: sampleWorld() };
  const project = {
    id: "b9b840a3-9a17-40e9-979b-e9682843eafa", worldId: world.id, name: "Sample depot transition", revision: 1,
    createdAt: timestamp, updatedAt: timestamp, document: createProjectDocument(createMockPresets(), createMockFleet(), createMockAnalysis()),
  };
  // Two plans over the same fleet, so switching scenario visibly changes the
  // effective year state without either plan touching the other.
  const scenarios = [
    {
      id: "63e41b98-588a-4bc7-a974-4ff8fcdbeb94", worldId: world.id, name: "Plan A · gradual", revision: 1, worldRevision: 1, createdAt: timestamp, updatedAt: timestamp,
      document: createScenarioDocument({
        "UNIT-01": { transitionYear: 2029, targetPresetId: "electric-van" },
        "UNIT-02": { transitionYear: 2032, targetPresetId: "electric-box-truck" },
        "UNIT-05": { transitionYear: 2031, targetPresetId: "electric-van" },
      }),
    },
    {
      id: "f5fd6ce9-a8f9-4d91-ad38-b22880658134", worldId: world.id, name: "Plan B · fast", revision: 1, worldRevision: 1, createdAt: timestamp, updatedAt: timestamp,
      document: createScenarioDocument({
        "UNIT-01": { transitionYear: 2026, targetPresetId: "electric-van" },
        "UNIT-02": { transitionYear: 2027, targetPresetId: "electric-box-truck" },
        "UNIT-04": { transitionYear: 2026, targetPresetId: "electric-van" },
        "UNIT-05": { transitionYear: 2027, targetPresetId: "electric-van" },
        "UNIT-06": { transitionYear: 2028, targetPresetId: "electric-box-truck" },
      }),
    },
  ];
  return [{ project, worlds: [world], scenarios }];
}
