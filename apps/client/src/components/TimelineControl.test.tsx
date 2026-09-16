import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TimelineControl } from "./TimelineControl";
import { END_YEAR, START_YEAR, useTimelineStore } from "../state/timelineStore";
import { initialVehicles, useFleetStore } from "../state/fleetStore";
import { loadDefaultPresets } from "../vehicles/defaults";
import { usePresetStore } from "../state/presetStore";
import { createDocument } from "../state/sceneStore";
import { createProjectFields, useProjectStore } from "../state/projectStore";

beforeEach(() => {
  vi.useFakeTimers();
  useTimelineStore.getState().resetYear();
  useFleetStore.setState({ vehicles: initialVehicles });
  const presets = loadDefaultPresets();
  usePresetStore.getState().replacePresets(presets);
  useProjectStore.setState(createProjectFields("Timeline test", createDocument(), 0, presets));
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

test("slider and event markers select the shared year", () => {
  render(<TimelineControl />);
  fireEvent.change(screen.getByRole("slider", { name: "Selected year" }), { target: { value: "2030" } });
  expect(useTimelineStore.getState().selectedYear).toBe(2030);
  fireEvent.click(screen.getByRole("button", { name: "2029: Depot charger installation" }));
  expect(useTimelineStore.getState().selectedYear).toBe(2029);
});

test("vehicle markers follow scheduled years and disappear for No change", () => {
  render(<TimelineControl />);
  const scenarioId = useProjectStore.getState().activeScenarioId;
  act(() => useProjectStore.getState().updateScenarioVehiclePlan(scenarioId, "UNIT-01", { transitionYear: 2035 }));
  expect(screen.getByRole("button", { name: "2035: 1 vehicle changes" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "2027: 1 vehicle changes" })).not.toBeInTheDocument();
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
