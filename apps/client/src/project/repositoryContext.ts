import { createIndexedDbProjectRepository } from "./indexedDbRepository";
import type { ProjectRepository } from "./repository";

let repository: ProjectRepository = createIndexedDbProjectRepository();

export function getProjectRepository(): ProjectRepository {
  return repository;
}

export function setProjectRepositoryInstance(next: ProjectRepository): void {
  repository = next;
}
