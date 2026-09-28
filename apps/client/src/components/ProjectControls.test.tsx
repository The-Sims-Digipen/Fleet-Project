import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";
import { createProjectFixture } from "../domain/projectFixture";
import { createMemoryProjectRepository } from "../project/repository";
import { createSampleProjects } from "../project/sampleProjects";
import { createProjectState, setProjectRepository, useProjectStore } from "../state/projectStore";

vi.mock("./WorldScene", () => ({ WorldScene: () => <div>Viewport test placeholder</div> }));
vi.mock("echarts-for-react", () => ({ default: () => <div data-testid="echarts" /> }));

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  setProjectRepository(createMemoryProjectRepository(createSampleProjects()));
  useProjectStore.setState(createProjectState(createProjectFixture()));
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
    await vi.waitFor(() => expect(useProjectStore.getState().runtime.record?.revision).toBe(1));
  });

  it("creates, renames, and removes scenarios in the Project aggregate", async () => {
    const user = userEvent.setup();
    render(<App />);
    const list = screen.getByRole("list", { name: "Project scenarios" });
    await user.click(screen.getByRole("button", { name: "New scenario" }));
    expect(within(list).getByRole("button", { name: "Plan C, scenario 3, active" })).toHaveAttribute("aria-pressed", "true");
    const scenarioName = screen.getByLabelText("Active scenario name");
    await user.clear(scenarioName);
    await user.type(scenarioName, "Fast plan{Enter}");
    await user.click(screen.getByRole("button", { name: "Remove scenario" }));
    await user.click(screen.getByRole("button", { name: "Remove Scenario" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
  });

  it("opens a persisted Project with its complete aggregate", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Open project" }));
    const dialog = screen.getByRole("dialog", { name: "Open Project" });
    await user.click(await within(dialog).findByRole("button", { name: "Open Sample depot transition" }));
    const document = useProjectStore.getState().runtime.document;
    expect(screen.getByLabelText("Project name")).toHaveValue("Sample depot transition");
    expect(document.environment.vehicles).toHaveLength(6);
    expect(document.scenarios).toHaveLength(2);
  });

  it("reports unreadable imports in plain language", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.upload(screen.getByLabelText("Choose project file"), new File(["not-json"], "broken.fleetproject", { type: "application/json" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("not a readable project file");
  });
});
