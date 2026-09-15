import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { createMemoryProjectRepository } from "../project/repository";
import { createSampleProjects } from "../project/sampleProjects";
import { createProjectFields, setProjectRepository, useProjectStore } from "../state/projectStore";
import { createDocument, useSceneStore } from "../state/sceneStore";

vi.mock("./WorldScene", () => ({ WorldScene: () => <div>Viewport test placeholder</div> }));
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  setProjectRepository(createMemoryProjectRepository(createSampleProjects()));
  const document = createDocument();
  useSceneStore.setState({ document, editor: { selectedObjectId: "sample" }, history: { past: [], future: [], baseline: null } });
  useProjectStore.setState(createProjectFields("Untitled project", document));
});
afterEach(cleanup);

describe("project and scenario controls", () => {
  it("names and saves the current project", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(useProjectStore.getState().projectId).toBeNull();
    const name = screen.getByLabelText("Project name");
    await user.clear(name);
    expect(screen.getByRole("alert")).toHaveTextContent("Name is required.");
    await user.keyboard("{Escape}");
    expect(name).toHaveValue("Untitled project");
    await user.clear(name);
    await user.type(name, "Depot transition{Enter}");
    expect(name).toHaveValue("Depot transition");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await vi.waitFor(() => useProjectStore.getState().projectId)).not.toBeNull();
    expect(useProjectStore.getState().revision).toBe(1);
    await user.click(screen.getByRole("button", { name: "Add Object" }));
    await user.click(screen.getByRole("button", { name: "Create Object" }));
    expect(useProjectStore.getState().revision).toBe(1);
  });

  it("creates, selects, renames, and deletes scenarios with a clear active scenario", async () => {
    const user = userEvent.setup();
    render(<App />);
    const list = screen.getByRole("list", { name: "Scenarios" });
    await user.click(screen.getByRole("button", { name: "New Scenario" }));
    expect(within(list).getByRole("button", { name: "Plan B, scenario 2, active" })).toHaveAttribute("aria-pressed", "true");
    const scenarioName = screen.getByLabelText("Active scenario name");
    await user.clear(scenarioName);
    await user.type(scenarioName, "Fast plan{Enter}");
    expect(within(list).getByRole("button", { name: "Fast plan, scenario 2, active" })).toBeInTheDocument();
    await user.click(within(list).getByRole("button", { name: "Plan A, scenario 1" }));
    expect(within(list).getByRole("button", { name: "Plan A, scenario 1, active" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete Scenario" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  it("opens a saved project from the list and warns before discarding changes", async () => {
    const user = userEvent.setup();
    render(<App />);
    useSceneStore.getState().setLight(10);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = screen.getByRole("dialog", { name: "Open Project" });
    expect(within(dialog).getByText(/Unsaved changes in “Untitled project” will be discarded/)).toBeInTheDocument();
    await user.click(await within(dialog).findByRole("button", { name: "Open Sample depot transition" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Project name")).toHaveValue("Sample depot transition");
    expect(useProjectStore.getState().projectId).toBe("sample-depot-transition");
    expect(useSceneStore.getState().document.objects).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Plan B · fast, scenario 2" }));
    expect(useSceneStore.getState().document.objects).toHaveLength(4);
    expect(useProjectStore.getState().activeScenarioId).toBe("sample-plan-b");
  });

  it("creates a named new project from the New dialog", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "New" }));
    const dialog = screen.getByRole("dialog", { name: "New Project" });
    const input = within(dialog).getByLabelText("Project name");
    await user.clear(input);
    expect(within(dialog).getByRole("button", { name: "Create Project" })).toBeDisabled();
    await user.type(input, "Second depot");
    await user.click(within(dialog).getByRole("button", { name: "Create Project" }));
    expect(screen.getAllByLabelText("Project name")[0]).toHaveValue("Second depot");
    expect(screen.getByRole("button", { name: "Plan A, scenario 1, active" })).toBeInTheDocument();
  });
});
