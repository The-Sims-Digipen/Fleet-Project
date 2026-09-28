import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";

import { addVehicleTransition } from "../domain/project";
import { createProjectFixture } from "../domain/projectFixture";
import { createIndexedDbProjectRepository } from "./indexedDbRepository";
import { createMemoryProjectRepository, ProjectConflictError } from "./repository";
import type { ProjectRepository } from "./repository";

const adapters: Array<{ name: string; createRepository: () => ProjectRepository }> = [
  { name: "memory", createRepository: () => createMemoryProjectRepository() },
  { name: "IndexedDB", createRepository: () => createIndexedDbProjectRepository(`fleet-project-test-${crypto.randomUUID()}`) },
];

describe.each(adapters)("aggregate Project repository contract: $name", ({ createRepository }) => {
  it("creates, lists, loads, and updates one complete Project record", async () => {
    const repository = createRepository();
    const document = addVehicleTransition(
      createProjectFixture("project-1"),
      { scenarioId: "plan-a", vehicleId: "UNIT-01" },
      { year: 2030, targetPresetId: "electric-van" },
    );

    const created = await repository.createProject(document);
    expect(created.revision).toBe(1);
    expect(created.document).toEqual(document);
    expect(await repository.listProjects()).toEqual([
      expect.objectContaining({ id: "project-1", name: document.name, revision: 1, scenarioCount: 2 }),
    ]);
    expect(await repository.getProject("project-1")).toEqual(created);

    const updatedDocument = { ...document, name: "Updated study" };
    const updated = await repository.updateProject(updatedDocument, created.revision);
    expect(updated.revision).toBe(2);
    expect(updated.document.name).toBe("Updated study");
    expect(updated.document.scenarios[0].vehiclePlans["UNIT-01"].transitions).toEqual([
      { year: 2030, targetPresetId: "electric-van" },
    ]);
  });

  it("leaves the complete stored aggregate unchanged after a stale revision", async () => {
    const repository = createRepository();
    const document = createProjectFixture("project-1");
    const created = await repository.createProject(document);

    await expect(repository.updateProject({ ...document, name: "Stale write" }, created.revision - 1)).rejects.toBeInstanceOf(ProjectConflictError);

    expect(await repository.getProject(document.id)).toEqual(created);
  });

  it("rejects unsupported or invalid documents without storing them", async () => {
    const repository = createRepository();
    await expect(repository.createProject({ ...createProjectFixture(), version: 4 } as never)).rejects.toThrow(/unsupported Project document version/i);
    expect(await repository.listProjects()).toEqual([]);
  });
});
