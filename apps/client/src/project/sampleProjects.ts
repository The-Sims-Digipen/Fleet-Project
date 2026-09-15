import { createObject } from "../scene/catalog";
import type { SceneDocument } from "../scene/types";
import type { ProjectRecord } from "./types";

function vanRow(prefix: string, count: number): SceneDocument {
  return {
    version: 2,
    light: 65,
    objects: Array.from({ length: count }, (_, index) => {
      const van = createObject("van", `${prefix}-van-${index + 1}`)!;
      van.name = `Van ${index + 1}`;
      van.transform.position = [(index - (count - 1) / 2) * 3, 0, 0];
      return van;
    }),
  };
}

/** Placeholder projects shown in Open Project until backend persistence exists. */
export function createSampleProjects(): ProjectRecord[] {
  const timestamp = "2026-09-10T09:00:00.000Z";
  return [{
    id: "sample-depot-transition",
    name: "Sample depot transition",
    revision: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    document: {
      version: 1,
      scenarios: [
        { id: "sample-plan-a", name: "Plan A · gradual", scene: vanRow("plan-a", 2) },
        { id: "sample-plan-b", name: "Plan B · fast", scene: vanRow("plan-b", 4) },
      ],
    },
  }];
}
