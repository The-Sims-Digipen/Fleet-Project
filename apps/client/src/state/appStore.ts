import { create } from "zustand";

import { getProjectRepository } from "../project/repositoryContext";
import type { AggregateProjectSummary } from "../project/types";

export type RepositoryStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string };

export type SaveStatus =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "error"; message: string };

type AppState = {
  projectSummaries: AggregateProjectSummary[];
  repositoryStatus: RepositoryStatus;
  saveStatus: SaveStatus;
  setRepositoryStatus: (status: RepositoryStatus) => void;
  setSaveStatus: (status: SaveStatus) => void;
  refreshProjects: () => Promise<AggregateProjectSummary[]>;
  resetRepositoryState: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  projectSummaries: [],
  repositoryStatus: { state: "idle" },
  saveStatus: { state: "idle" },
  setRepositoryStatus: (repositoryStatus) => set({ repositoryStatus }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  refreshProjects: async () => {
    set({ repositoryStatus: { state: "loading" } });
    try {
      const projectSummaries = await getProjectRepository().listProjects();
      set({ projectSummaries, repositoryStatus: { state: "idle" } });
      return projectSummaries;
    } catch (error) {
      set({ repositoryStatus: { state: "error", message: error instanceof Error ? error.message : "Projects could not be loaded." } });
      throw error;
    }
  },
  resetRepositoryState: () => set({ projectSummaries: [], repositoryStatus: { state: "idle" }, saveStatus: { state: "idle" } }),
}));
