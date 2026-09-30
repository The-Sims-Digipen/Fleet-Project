import { create } from "zustand";

import { getProjectRepository } from "../project/repositoryContext";
import type { ProjectSummary } from "../project/types";

export type RepositoryStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string };

export type WorkspaceMode = "plan" | "compare";
export type ProjectDialog = "new" | "open" | null;

export const SIDEBAR_PANEL_IDS = [
  "scenarios",
  "fleet",
  "timeline",
  "vehicle-presets",
  "analysis",
  "inspector",
  "feasibility",
  "scene",
  "cost-analysis",
  "debug",
  "audio-demo",
] as const;

export type SidebarPanelId = (typeof SIDEBAR_PANEL_IDS)[number];
export type SidebarPanelState = Record<SidebarPanelId, boolean>;

export const DEFAULT_SIDEBAR_PANELS: SidebarPanelState = {
  scenarios: true,
  fleet: true,
  timeline: true,
  "vehicle-presets": true,
  analysis: true,
  inspector: true,
  feasibility: false,
  scene: false,
  "cost-analysis": true,
  debug: false,
  "audio-demo": false,
};

type AppState = {
  projectSummaries: ProjectSummary[];
  repositoryStatus: RepositoryStatus;
  projectDialog: ProjectDialog;
  workspaceMode: WorkspaceMode;
  sidebarPanels: SidebarPanelState;
  setRepositoryStatus: (status: RepositoryStatus) => void;
  setProjectDialog: (dialog: ProjectDialog) => void;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  setSidebarPanelExpanded: (panel: SidebarPanelId, expanded: boolean) => void;
  refreshProjects: () => Promise<ProjectSummary[]>;
  resetRepositoryState: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  projectSummaries: [],
  repositoryStatus: { state: "idle" },
  projectDialog: null,
  workspaceMode: "plan",
  sidebarPanels: { ...DEFAULT_SIDEBAR_PANELS },
  setRepositoryStatus: (repositoryStatus) => set({ repositoryStatus }),
  setProjectDialog: (projectDialog) => set({ projectDialog }),
  setWorkspaceMode: (workspaceMode) => set({ workspaceMode }),
  setSidebarPanelExpanded: (panel, expanded) => set((state) => ({
    sidebarPanels: { ...state.sidebarPanels, [panel]: expanded },
  })),
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
  resetRepositoryState: () => set({ projectSummaries: [], repositoryStatus: { state: "idle" }, projectDialog: null }),
}));
