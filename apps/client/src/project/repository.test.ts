import { describe, expect, it } from "vitest";
import { sim01Project, sim01Scenario } from "../domain/m1Fixture";
import { createMemoryProjectRepository, ProjectConflictError } from "./repository";
import type { WorkspaceSaveInput } from "./types";

function workspaceInput(): WorkspaceSaveInput {
  return {
    project: { id: "project", name: "Depot study", activeScenarioId: "scenario", document: sim01Project },
    scenarios: [{ id: "scenario", name: "Plan A", expectedRevision: 0, document: sim01Scenario }],
  };
}

describe("memory project repository contract", () => {
  it("round-trips one project environment and its scenarios", async () => {
    const repository = createMemoryProjectRepository();
    const input = workspaceInput();
    input.project.document = { ...sim01Project, simulationResult: { savings: 100 } } as typeof sim01Project;
    input.scenarios[0].document = { ...sim01Scenario, results: [1, 2, 3] } as typeof sim01Scenario;
    const saved = await repository.createWorkspace(input);
    expect(saved.project.document).toEqual(sim01Project);
    expect(saved.project.activeScenarioId).toBe("scenario");
    expect(saved.scenarios[0].document).toEqual(sim01Scenario);
    expect(saved.project.revision).toBe(1);
    expect(saved.scenarios[0]).toMatchObject({ revision: 1, projectId: saved.project.id, position: 0 });
  });

  it("leaves the stored workspace unchanged after a scenario conflict", async () => {
    const repository = createMemoryProjectRepository();
    const created = await repository.createWorkspace(workspaceInput());
    await expect(repository.updateWorkspace({
      project: {
        id: created.project.id,
        name: created.project.name,
        activeScenarioId: created.project.activeScenarioId,
        expectedRevision: created.project.revision,
        document: created.project.document,
      },
      scenarios: [{
        id: created.scenarios[0].id,
        name: created.scenarios[0].name,
        expectedRevision: 0,
        document: created.scenarios[0].document,
      }],
    })).rejects.toBeInstanceOf(ProjectConflictError);
    const unchanged = await repository.getWorkspace(created.project.id);
    expect(unchanged.project.revision).toBe(1);
    expect(unchanged.scenarios[0].revision).toBe(1);
  });
});
