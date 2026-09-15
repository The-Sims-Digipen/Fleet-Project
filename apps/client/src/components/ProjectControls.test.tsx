import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { createMemoryProjectRepository } from "../project/repository";
import { createSampleProjects } from "../project/sampleProjects";
import { loadDefaultPresets } from "../vehicles/defaults";
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
  const presets = loadDefaultPresets();
  usePresetStore.getState().replacePresets(presets);
  useSceneStore.setState({ document, editor: createEditorState(), history: { past: [], future: [], baseline: null } });
  useProjectStore.setState(createProjectFields("Untitled project", document, 0, presets));
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

  it("creates, selects, renames, and removes scenarios without changing the world", async () => {
    const user = userEvent.setup();
    render(<App />);
    const world = useSceneStore.getState().document;
    const list = screen.getByRole("list", { name: "Scenarios for selected world" });
    await user.click(screen.getByRole("button", { name: "New scenario" }));
    expect(within(list).getByRole("button", { name: "Plan B, scenario 2, active" })).toHaveAttribute("aria-pressed", "true");
    const scenarioName = screen.getByLabelText("Active scenario name");
    await user.clear(scenarioName);
    await user.type(scenarioName, "Fast plan{Enter}");
    expect(useSceneStore.getState().document).toBe(world);
    await user.click(screen.getByRole("button", { name: "Remove scenario" }));
    await user.click(screen.getByRole("button", { name: "Remove Scenario" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
  });

  it("opens a persisted sample workspace", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Open project" }));
    const dialog = screen.getByRole("dialog", { name: "Open Project" });
    await user.click(await within(dialog).findByRole("button", { name: "Open Sample depot transition" }));
    expect(screen.getByLabelText("Project name")).toHaveValue("Sample depot transition");
    expect(useSceneStore.getState().document.objects).toHaveLength(4);
  });

  it("can start a new project from a saved world", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "New project" }));
    const dialog = screen.getByRole("dialog", { name: "New Project" });
    await vi.waitFor(() => expect(within(dialog).getByLabelText("3D world").querySelectorAll("option").length).toBeGreaterThan(1));
    const input = within(dialog).getByLabelText("Project name");
    await user.clear(input);
    await user.type(input, "Second depot");
    await user.selectOptions(within(dialog).getByLabelText("3D world"), createSampleProjects()[0].world.id);
    await user.click(within(dialog).getByRole("button", { name: "Create Project" }));
    expect(screen.getAllByLabelText("Project name")[0]).toHaveValue("Second depot");
    expect(useSceneStore.getState().document.objects).toHaveLength(4);
  });
  it("shows saved scenarios for the selected world and attaches one when chosen", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);

    const worldSelect = screen.getByRole("combobox", { name: "World" });
    await vi.waitFor(() => expect(within(worldSelect).getByRole("option", { name: "Sample depot" })).toBeInTheDocument());
    await user.selectOptions(worldSelect, createSampleProjects()[0].world.id);

    await vi.waitFor(() => expect(useProjectStore.getState().worldName).toBe("Sample depot"));
    expect(useProjectStore.getState().projectId).toBeNull();
    const list = screen.getByRole("list", { name: "Scenarios for selected world" });
    expect(within(list).getByRole("button", { name: /Plan B · fast, scenario .*available/ })).toBeInTheDocument();

    await user.click(within(list).getByRole("button", { name: /Plan B · fast, scenario .*available/ }));
    expect(useProjectStore.getState().scenarios.some((scenario) => scenario.name === "Plan B · fast")).toBe(true);
    expect(useProjectStore.getState().scenarios.find((scenario) => scenario.name === "Plan B · fast")?.id).toBe(useProjectStore.getState().activeScenarioId);
  });

});
