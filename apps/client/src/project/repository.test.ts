import { describe, expect, it } from "vitest";
import { sim01Project, sim01Scenario } from "../domain/m1Fixture";
import { createDocument } from "../state/sceneStore";
import { createMemoryProjectRepository, ProjectConflictError } from "./repository";
import type { WorkspaceSaveInput } from "./types";

function workspaceInput(): WorkspaceSaveInput {
  return {
    project: { id: "project", name: "Depot study", activeWorldId: "world", document: sim01Project },
    worlds: [{ id: "world", name: "Main depot", expectedRevision: 0, document: createDocument() }],
    scenarios: [{ id: "scenario", worldId: "world", name: "Plan A", expectedRevision: 0, document: sim01Scenario }],
  };
}

describe("memory project repository contract", () => {
  it("round-trips canonical authoritative documents without derived output", async () => {
    const repository = createMemoryProjectRepository();
    const input = workspaceInput();
    input.project.document = { ...sim01Project, simulationResult: { savings: 100 } } as typeof sim01Project;
    input.scenarios[0].document = { ...sim01Scenario, results: [1, 2, 3] } as typeof sim01Scenario;

    const saved = await repository.createWorkspace(input);
    expect(saved.project.document).toEqual(sim01Project);
    expect(saved.scenarios[0].document).toEqual(sim01Scenario);
    expect(saved.project.revision).toBe(1);
    expect(saved.worlds[0].revision).toBe(1);
    expect(saved.scenarios[0].revision).toBe(1);
  });

  it("leaves the last stored workspace unchanged when a later entity conflicts", async () => {
    const repository = createMemoryProjectRepository();
    const created = await repository.createWorkspace(workspaceInput());
    const changedWorld = { ...created.worlds[0].document, light: 12 };

    await expect(repository.updateWorkspace({
      project: {
        id: created.project.id,
        name: created.project.name,
        activeWorldId: created.project.worldId,
        expectedRevision: created.project.revision,
        document: created.project.document,
      },
      worlds: [{
        id: created.worlds[0].id,
        name: created.worlds[0].name,
        expectedRevision: created.worlds[0].revision,
        document: changedWorld,
      }],
      scenarios: [{
        id: created.scenarios[0].id,
        worldId: created.scenarios[0].worldId,
        name: created.scenarios[0].name,
        expectedRevision: 0,
        document: created.scenarios[0].document,
      }],
    })).rejects.toBeInstanceOf(ProjectConflictError);

    const unchanged = await repository.getWorkspace(created.project.id);
    expect(unchanged.project.revision).toBe(1);
    expect(unchanged.worlds[0].revision).toBe(1);
    expect(unchanged.worlds[0].document.light).toBe(created.worlds[0].document.light);
    expect(unchanged.scenarios[0].revision).toBe(1);
  });
});
