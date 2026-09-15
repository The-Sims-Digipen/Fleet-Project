import { createObject } from "../scene/catalog";
import type { SceneDocument } from "../scene/types";
import { loadDefaultPresets } from "../vehicles/defaults";
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
    createdAt: timestamp, updatedAt: timestamp, document: { version: 2 as const, vehiclePresets: loadDefaultPresets() },
  };
  const scenarios = [
    { id: "63e41b98-588a-4bc7-a974-4ff8fcdbeb94", worldId: world.id, name: "Plan A · gradual", revision: 1, worldRevision: 1, createdAt: timestamp, updatedAt: timestamp, document: { version: 1 as const } },
    { id: "f5fd6ce9-a8f9-4d91-ad38-b22880658134", worldId: world.id, name: "Plan B · fast", revision: 1, worldRevision: 1, createdAt: timestamp, updatedAt: timestamp, document: { version: 1 as const } },
  ];
  return [{ project, world, scenarios }];
}
