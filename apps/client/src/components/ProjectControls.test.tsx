import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { createMemoryProjectRepository } from "../project/repository";
import { createSampleProjects } from "../project/sampleProjects";
import { createMockAnalysis, createMockFleet, createMockPresets } from "../domain/mockProject";
import { DEFAULT_DEPOT_OBJECT_ID } from "../scene/defaultProjectScene";
import { useFleetStore } from "../state/fleetStore";
import { usePresetStore } from "../state/presetStore";
import { createProjectFields, setProjectRepository, useProjectStore } from "../state/projectStore";
import { createDocument, createEditorState, useSceneStore } from "../state/sceneStore";

vi.mock("./WorldScene", () => ({ WorldScene: () => <div>Viewport test placeholder</div> }));

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  setProjectRepository(createMemoryProjectRepository(createSampleProjects()));
  const document = createDocument();
  const inputs = { presets: createMockPresets(), fleet: createMockFleet(), analysis: createMockAnalysis() };
  usePresetStore.getState().replacePresets(inputs.presets);
  useFleetStore.getState().updateAnalysis(inputs.analysis);
  useFleetStore.getState().replaceFleet(inputs.fleet);
  useSceneStore.setState({ document, editor: createEditorState(), history: { past: [], future: [], baseline: null } });
  useProjectStore.setState(createProjectFields("Untitled project", document, 0, inputs));
});
afterEach(cleanup);

describe("project and scenario controls", () => {
  it("names and saves the current project", async () => {
    const user = userEvent.setup();
    render(<App />);
    const name = screen.getByLabelText("Project name");
    await user.clear(name);
    await user.type(name, "Depot transition{Enter}");
    await user.click(screen.getByRole("button", { name: "Save project" }));
    expect(await vi.waitFor(() => useProjectStore.getState().projectId)).not.toBeNull();
    expect(useProjectStore.getState().revision).toBe(1);
  });

  it("creates, renames, and removes scenarios without duplicating the environment", async () => {
    const user = userEvent.setup();
    render(<App />);
    const scene = useSceneStore.getState().document;
    const list = screen.getByRole("list", { name: "Project scenarios" });
    await user.click(screen.getByRole("button", { name: "New scenario" }));
    expect(within(list).getByRole("button", { name: "Plan B, scenario 2, active" })).toHaveAttribute("aria-pressed", "true");
    const scenarioName = screen.getByLabelText("Active scenario name");
    await user.clear(scenarioName);
    await user.type(scenarioName, "Fast plan{Enter}");
    expect(useSceneStore.getState().document).toBe(scene);
    await user.click(screen.getByRole("button", { name: "Remove scenario" }));
    await user.click(screen.getByRole("button", { name: "Remove Scenario" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
  });

  it("opens a persisted project with its scene, fleet, and scenarios", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Open project" }));
    const dialog = screen.getByRole("dialog", { name: "Open Project" });
    await user.click(await within(dialog).findByRole("button", { name: "Open Sample depot transition" }));
    expect(screen.getByLabelText("Project name")).toHaveValue("Sample depot transition");
    expect(useSceneStore.getState().document.objects.some((object) => object.id === DEFAULT_DEPOT_OBJECT_ID)).toBe(true);
    expect(useProjectStore.getState().scenarios).toHaveLength(2);
  });

  it("creates a fresh project with the default depot and no world picker", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "New project" }));
    const dialog = screen.getByRole("dialog", { name: "New Project" });
    expect(within(dialog).queryByLabelText("3D world")).not.toBeInTheDocument();
    const input = within(dialog).getByLabelText("Project name");
    await user.clear(input);
    await user.type(input, "Second depot");
    await user.click(within(dialog).getByRole("button", { name: "Create Project" }));
    expect(screen.getAllByLabelText("Project name")[0]).toHaveValue("Second depot");
    expect(useSceneStore.getState().document.objects.some((object) => object.id === DEFAULT_DEPOT_OBJECT_ID)).toBe(true);
  });
});
