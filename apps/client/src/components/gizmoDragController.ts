import { isTypingTarget } from "./eventTargets";

export type GizmoControlAdapter = {
  dragging: boolean;
  reset: () => void;
  pointerUp: (pointer: null) => void;
};

type GizmoDragDependencies = {
  controls: GizmoControlAdapter;
  canEdit: () => boolean;
  markDragged: () => void;
  syncTransform: () => void;
  beginEdit: () => void;
  commitEdit: () => void;
  cancelEdit: () => void;
  enableCamera: () => void;
};

export type GizmoDragController = {
  begin: () => void;
  change: () => void;
  finish: () => void;
  cancel: () => void;
};

/** Coordinates one TransformControls gesture with one Project history edit. */
export function createGizmoDragController(dependencies: GizmoDragDependencies): GizmoDragController {
  let cancelled = false;

  return {
    begin() {
      if (!dependencies.canEdit()) return;
      cancelled = false;
      dependencies.markDragged();
      dependencies.beginEdit();
    },
    change() {
      if (cancelled || !dependencies.canEdit()) return;
      dependencies.syncTransform();
    },
    finish() {
      if (cancelled || !dependencies.canEdit()) return;
      dependencies.markDragged();
      dependencies.syncTransform();
      dependencies.commitEdit();
    },
    cancel() {
      if (cancelled || !dependencies.controls.dragging) return;
      cancelled = true;
      dependencies.controls.reset();
      dependencies.cancelEdit();
      dependencies.enableCamera();
      dependencies.controls.pointerUp(null);
      dependencies.markDragged();
    },
  };
}

/** Binds browser cancellation signals to the same controller used by TransformControls. */
export function bindGizmoDragCancellation(
  controller: GizmoDragController,
  controls: Pick<GizmoControlAdapter, "dragging">,
  host: Window = window,
): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || isTypingTarget(event.target) || !controls.dragging) return;
    event.preventDefault();
    controller.cancel();
  };
  const cancel = () => controller.cancel();

  host.addEventListener("keydown", onKeyDown);
  host.addEventListener("pointercancel", cancel);
  host.addEventListener("blur", cancel);
  return () => {
    host.removeEventListener("keydown", onKeyDown);
    host.removeEventListener("pointercancel", cancel);
    host.removeEventListener("blur", cancel);
  };
}
