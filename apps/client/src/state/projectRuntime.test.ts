import { describe, expect, it } from "vitest";

import { createProjectV5Fixture } from "../domain/projectV5Fixture";
import {
  beginProjectEdit,
  cancelProjectEdit,
  commitProjectEdit,
  createProjectRuntime,
  executeProjectCommand,
  isProjectDirty,
  markProjectSaved,
  previewProjectCommand,
  redoProjectCommand,
  replaceOpenProject,
  undoProjectCommand,
  updateProjectEditor,
} from "./projectRuntime";

describe("consolidated Project runtime", () => {
  it("records discrete document commands but not no-ops or editor actions", () => {
    const initial = createProjectRuntime(createProjectV5Fixture());
    const selected = updateProjectEditor(initial, { selection: { kind: "vehicle", id: "UNIT-01" }, selectedYear: 2030 });
    const unchanged = executeProjectCommand(selected, { type: "rename-project", name: selected.document.name });
    const renamed = executeProjectCommand(unchanged, { type: "rename-project", name: "Renamed project" });

    expect(selected.history.past).toHaveLength(0);
    expect(unchanged.history.past).toHaveLength(0);
    expect(renamed.history.past).toHaveLength(1);
    expect(renamed.editor.selection).toEqual({ kind: "vehicle", id: "UNIT-01" });
    expect(isProjectDirty(renamed)).toBe(true);
  });

  it("groups previews into one Undo entry and restores the start on cancellation", () => {
    const initial = createProjectRuntime(createProjectV5Fixture());
    const editing = beginProjectEdit(initial);
    const first = previewProjectCommand(editing, { type: "rename-project", name: "First preview" });
    const second = previewProjectCommand(first, { type: "rename-project", name: "Second preview" });
    const committed = commitProjectEdit(second);

    expect(committed.document.name).toBe("Second preview");
    expect(committed.history.past).toHaveLength(1);
    expect(undoProjectCommand(committed).document.name).toBe(initial.document.name);
    expect(cancelProjectEdit(previewProjectCommand(beginProjectEdit(committed), { type: "rename-project", name: "Cancelled" })).document.name).toBe("Second preview");
  });

  it("finishes an active edit before selection, panel, or transform-tool changes", () => {
    const editing = previewProjectCommand(beginProjectEdit(createProjectRuntime(createProjectV5Fixture())), {
      type: "rename-project",
      name: "Previewed name",
    });
    const selected = updateProjectEditor(editing, { selection: { kind: "vehicle", id: "UNIT-01" } });

    expect(selected.history.activeEdit).toBeNull();
    expect(selected.history.past).toHaveLength(1);
    expect(selected.editor.selection).toEqual({ kind: "vehicle", id: "UNIT-01" });
  });

  it("makes active Scenario changes undoable and clears missing selections", () => {
    const initial = updateProjectEditor(createProjectRuntime(createProjectV5Fixture()), { selection: { kind: "vehicle", id: "UNIT-01" } });
    const switched = executeProjectCommand(initial, { type: "set-active-scenario", scenarioId: "plan-b" });
    const deleted = executeProjectCommand(switched, { type: "delete-vehicle", vehicleId: "UNIT-01" });

    expect(switched.document.activeScenarioId).toBe("plan-b");
    expect(deleted.editor.selection).toBeNull();
    const restoredVehicle = undoProjectCommand(deleted);
    expect(restoredVehicle.document.environment.vehicles).toHaveLength(1);
    expect(restoredVehicle.editor.selection).toBeNull();
    expect(undoProjectCommand(restoredVehicle).document.activeScenarioId).toBe("plan-a");
    expect(redoProjectCommand(undoProjectCommand(restoredVehicle)).document.activeScenarioId).toBe("plan-b");
  });

  it("keeps the saved baseline separate from edit snapshots and history", () => {
    const initial = createProjectRuntime(createProjectV5Fixture());
    const renamed = executeProjectCommand(initial, { type: "rename-project", name: "Saved name" });
    const saved = markProjectSaved(renamed, { revision: 2, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z" }, renamed.document);

    expect(isProjectDirty(saved)).toBe(false);
    expect(saved.history.past).toHaveLength(1);
    const undone = undoProjectCommand(saved);
    expect(undone.document.name).toBe(initial.document.name);
    expect(isProjectDirty(undone)).toBe(true);
  });

  it("replacing the open Project resets editor state and history", () => {
    const first = executeProjectCommand(
      updateProjectEditor(createProjectRuntime(createProjectV5Fixture("first")), { selection: { kind: "vehicle", id: "UNIT-01" }, selectedYear: 2031 }),
      { type: "rename-project", name: "Changed" },
    );
    const secondDocument = createProjectV5Fixture("second");
    const replaced = replaceOpenProject(first, secondDocument, { revision: 1, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" });

    expect(replaced.document.id).toBe("second");
    expect(replaced.editor.selection).toBeNull();
    expect(replaced.editor.selectedYear).toBe(secondDocument.analysis.startYear);
    expect(replaced.history).toEqual({ past: [], future: [], activeEdit: null });
    expect(isProjectDirty(replaced)).toBe(false);
  });
});
