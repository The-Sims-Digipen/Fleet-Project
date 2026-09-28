import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { createProjectFixture } from "../domain/projectFixture";
import { createProjectState, useProjectStore } from "../state/projectStore";
import { TimelineControl } from "./TimelineControl";

beforeEach(() => {
  vi.useFakeTimers();
  useProjectStore.setState(createProjectState(createProjectFixture()));
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

test("slider and event markers select the Project editor year", () => {
  useProjectStore.getState().replaceVehicleTransitions("plan-a", "UNIT-01", [{ year: 2029, targetPresetId: "electric-van" }]);
  render(<TimelineControl />);
  fireEvent.change(screen.getByRole("slider", { name: "Selected year" }), { target: { value: "2030" } });
  expect(useProjectStore.getState().runtime.editor.selectedYear).toBe(2030);
  fireEvent.click(screen.getByRole("button", { name: "2029: 1 vehicle changes" }));
  expect(useProjectStore.getState().runtime.editor.selectedYear).toBe(2029);
});

test("vehicle markers come from canonical scenario transitions", () => {
  const project = useProjectStore.getState();
  project.replaceVehicleTransitions("plan-a", "UNIT-01", [{ year: 2035, targetPresetId: "electric-van" }]);
  render(<TimelineControl />);
  expect(screen.getByRole("button", { name: "2035: 1 vehicle changes" })).toBeInTheDocument();
});

test("play advances annually, pause holds, and reset returns to the start", () => {
  render(<TimelineControl />);
  const startYear = useProjectStore.getState().runtime.document.analysis.startYear;
  fireEvent.click(screen.getByRole("button", { name: "Play" }));
  act(() => vi.advanceTimersByTime(2000));
  expect(useProjectStore.getState().runtime.editor.selectedYear).toBe(startYear + 2);
  fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  act(() => vi.advanceTimersByTime(2000));
  expect(useProjectStore.getState().runtime.editor.selectedYear).toBe(startYear + 2);
  fireEvent.click(screen.getByRole("button", { name: "Reset" }));
  expect(useProjectStore.getState().runtime.editor.selectedYear).toBe(startYear);
});
