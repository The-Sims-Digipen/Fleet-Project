import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TimelineControl } from "./TimelineControl";
import { END_YEAR, START_YEAR, useTimelineStore } from "../state/timelineStore";
import { useFleetStore } from "../state/fleetStore";
import { createMockAnalysis, createMockFleet, createMockPresets } from "../domain/mockProject";
import { usePresetStore } from "../state/presetStore";
import { createDocument } from "../state/sceneStore";
import { createProjectFields, useProjectStore } from "../state/projectStore";

beforeEach(() => {
  vi.useFakeTimers();
  useTimelineStore.getState().resetYear();
  const inputs = { presets: createMockPresets(), fleet: createMockFleet(), analysis: createMockAnalysis() };
  usePresetStore.getState().replacePresets(inputs.presets);
  useFleetStore.getState().updateAnalysis(inputs.analysis);
  useFleetStore.getState().replaceFleet(inputs.fleet);
  useProjectStore.setState(createProjectFields("Timeline test", createDocument(), 0, inputs));
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

test("slider and event markers select the shared year", () => {
  render(<TimelineControl />);
  fireEvent.change(screen.getByRole("slider", { name: "Selected year" }), { target: { value: "2030" } });
  expect(useTimelineStore.getState().selectedYear).toBe(2030);
  fireEvent.click(screen.getByRole("button", { name: "2029: Depot charger installation" }));
  expect(useTimelineStore.getState().selectedYear).toBe(2029);
});

test("vehicle markers appear only for a scenario plan that changes a preset", () => {
  render(<TimelineControl />);
  const scenarioId = useProjectStore.getState().activeScenarioId;
  // A year alone is not a transition; the plan also needs a different target.
  act(() => useProjectStore.getState().updateScenarioVehiclePlan(scenarioId, "UNIT-01", { transitionYear: 2035 }));
  expect(screen.queryByRole("button", { name: "2035: 1 vehicle changes" })).not.toBeInTheDocument();
  act(() => useProjectStore.getState().updateScenarioVehiclePlan(scenarioId, "UNIT-01", { targetPresetId: "electric-van" }));
  expect(screen.getByRole("button", { name: "2035: 1 vehicle changes" })).toBeInTheDocument();
  act(() => useProjectStore.getState().updateScenarioVehiclePlan(scenarioId, "UNIT-01", { transitionYear: null }));
  expect(screen.queryByRole("button", { name: "2035: 1 vehicle changes" })).not.toBeInTheDocument();
});

test("play advances annually, pause holds, and reset returns to the start", () => {
  render(<TimelineControl />);
  fireEvent.click(screen.getByRole("button", { name: "Play" }));
  act(() => vi.advanceTimersByTime(2000));
  expect(useTimelineStore.getState().selectedYear).toBe(START_YEAR + 2);
  fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  act(() => vi.advanceTimersByTime(2000));
  expect(useTimelineStore.getState().selectedYear).toBe(START_YEAR + 2);
  fireEvent.click(screen.getByRole("button", { name: "Reset" }));
  expect(useTimelineStore.getState().selectedYear).toBe(START_YEAR);
});

test("playback stops at the last year", () => {
  useTimelineStore.getState().setSelectedYear(END_YEAR - 1);
  render(<TimelineControl />);
  fireEvent.click(screen.getByRole("button", { name: "Play" }));
  act(() => vi.advanceTimersByTime(2000));
  expect(useTimelineStore.getState().selectedYear).toBe(END_YEAR);
  expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
});
