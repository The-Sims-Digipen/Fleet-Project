import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { createMemoryProjectRepository } from "./project/repository";
import { createSampleProjects } from "./project/sampleProjects";
import { DEFAULT_SIDEBAR_PANELS, useAppStore } from "./state/appStore";
import { DEFAULT_PROJECT_CAMERA } from "./state/projectRuntime";
import { createProjectState, setProjectRepository, useProjectStore } from "./state/projectStore";

vi.mock("./components/WorldScene", () => ({ WorldScene: () => <div data-testid="world-scene" /> }));
vi.mock("./components/ComparisonViewport", () => ({ ComparisonViewport: ({ year }: { year: number }) => <div data-testid="comparison-viewport" data-year={year} /> }));
vi.mock("echarts-for-react", () => ({ default: () => <div data-testid="echarts" /> }));

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  const record = createSampleProjects()[0];
  setProjectRepository(createMemoryProjectRepository([record]));
  useAppStore.setState({ workspaceMode: "plan", sidebarPanels: { ...DEFAULT_SIDEBAR_PANELS } });
  useProjectStore.setState(createProjectState(record.document));
});
afterEach(cleanup);

describe("application workspace", () => {
  it("renders scenarios, fleet, timeline, and presets from one Project document", async () => {
    render(<App />);
    expect(screen.getByLabelText("Project name")).toHaveValue("Sample depot transition");
    expect(screen.getByRole("list", { name: "Project scenarios" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Fleet vehicles" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Vehicle presets" })).toBeInTheDocument();
    expect(await screen.findByTestId("world-scene")).toBeInTheDocument();
  });

  it("writes fleet planning changes directly to the active scenario", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Target preset for UNIT-01" }), "electric-van");
    await user.selectOptions(screen.getByRole("combobox", { name: "Year to change for UNIT-01" }), "2030");

    const project = useProjectStore.getState().runtime.document;
    expect(project.scenarios.find((scenario) => scenario.id === project.activeScenarioId)?.vehiclePlans["UNIT-01"].transitions).toEqual([
      { year: 2030, targetPresetId: "electric-van" },
    ]);
  });

  it("opens the comparison workspace and shares its selected year", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("tab", { name: "Compare" }));
    const slider = screen.getByRole("slider", { name: "Comparison year" });
    fireEvent.change(slider, { target: { value: "2031" } });
    expect(screen.getAllByTestId("comparison-viewport").every((viewport) => viewport.getAttribute("data-year") === "2031")).toBe(true);
  });

  it("preserves application workspace and sidebar state across Projects", async () => {
    const user = userEvent.setup();
    const view = render(<App />);
    await user.click(screen.getByRole("button", { name: "Scenarios" }));
    expect(screen.getByRole("button", { name: "Scenarios" })).toHaveAttribute("aria-expanded", "false");

    await user.click(screen.getByRole("tab", { name: "Compare" }));
    useProjectStore.getState().newProject("Another Project");
    view.unmount();
    render(<App />);

    expect(screen.getByRole("tab", { name: "Compare" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("tab", { name: "Plan / Depot" }));
    expect(screen.getByRole("button", { name: "Scenarios" })).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the Plan camera for workspace remounts and resets it for another Project", async () => {
    const user = userEvent.setup();
    const camera = { position: [3, 4, 5], target: [1, 0, -2] } as const;
    render(<App />);
    useProjectStore.getState().setCamera({ position: [...camera.position], target: [...camera.target] });

    await user.click(screen.getByRole("tab", { name: "Compare" }));
    await user.click(screen.getByRole("tab", { name: "Plan / Depot" }));
    expect(useProjectStore.getState().runtime.editor.camera).toEqual(camera);

    useProjectStore.getState().newProject("Another Project");
    expect(useProjectStore.getState().runtime.editor.camera).toEqual(DEFAULT_PROJECT_CAMERA);
  });

  it("restores runtime lighting when a slider edit is cancelled", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Scene" }));
    const slider = screen.getByRole("slider", { name: "Light intensity" });
    const historyLength = useProjectStore.getState().runtime.history.past.length;

    fireEvent.pointerDown(slider, { pointerId: 1 });
    fireEvent.change(slider, { target: { value: "15" } });
    expect(useProjectStore.getState().runtime.editor.lightIntensity).toBe(15);
    fireEvent.pointerCancel(slider, { pointerId: 1 });

    expect(useProjectStore.getState().runtime.editor.lightIntensity).toBe(65);
    expect(useProjectStore.getState().runtime.history.past).toHaveLength(historyLength);
  });
});
