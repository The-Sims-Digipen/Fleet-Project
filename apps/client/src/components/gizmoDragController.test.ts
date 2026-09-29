import { beforeEach, describe, expect, it, vi } from "vitest";

import { createProjectFixture } from "../domain/projectFixture";
import { createMemoryProjectRepository } from "../project/repository";
import { createProjectState, setProjectRepository, useProjectStore } from "../state/projectStore";
import { bindGizmoDragCancellation, createGizmoDragController, type GizmoControlAdapter } from "./gizmoDragController";

beforeEach(() => {
  setProjectRepository(createMemoryProjectRepository());
  useProjectStore.setState(createProjectState(createProjectFixture()));
});

describe("gizmo drag controller", () => {
  it("cancels a held drag without allowing pointer-up to commit it", () => {
    const reference = { kind: "vehicle" as const, id: "UNIT-01" };
    const start = structuredClone(useProjectStore.getState().runtime.document.environment.vehicles[0].transform);
    let liveTransform = structuredClone(start);
    let cameraEnabled = false;
    let controller: ReturnType<typeof createGizmoDragController>;
    const controls: GizmoControlAdapter = {
      dragging: true,
      reset: vi.fn(() => { liveTransform = structuredClone(start); }),
      pointerUp: vi.fn(() => controller.finish()),
    };
    controller = createGizmoDragController({
      controls,
      canEdit: () => true,
      markDragged: vi.fn(),
      syncTransform: () => useProjectStore.getState().setProjectEntityTransform(reference, liveTransform),
      beginEdit: () => useProjectStore.getState().beginEdit(),
      commitEdit: () => useProjectStore.getState().commitEdit(),
      cancelEdit: () => useProjectStore.getState().cancelEdit(),
      enableCamera: () => { cameraEnabled = true; },
    });

    controller.begin();
    liveTransform = { ...start, position: [5, 0, 4] };
    controller.change();
    expect(useProjectStore.getState().runtime.document.environment.vehicles[0].transform.position).toEqual([5, 0, 4]);

    const unbind = bindGizmoDragCancellation(controller, controls);
    const escape = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
    window.dispatchEvent(escape);
    controller.finish();
    unbind();

    const runtime = useProjectStore.getState().runtime;
    expect(escape.defaultPrevented).toBe(true);
    expect(runtime.document.environment.vehicles[0].transform).toEqual(start);
    expect(runtime.history.activeEdit).toBeNull();
    expect(runtime.history.past).toHaveLength(0);
    expect(cameraEnabled).toBe(true);
    expect(controls.pointerUp).toHaveBeenCalledOnce();
  });
});
