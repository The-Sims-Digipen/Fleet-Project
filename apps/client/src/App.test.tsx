import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { createMemoryProjectRepository } from "./project/repository";
import { createSampleProjects } from "./project/sampleProjects";
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
});
