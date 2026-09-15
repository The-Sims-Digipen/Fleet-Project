import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { Mesh, Vector3, type Group, type Object3D } from "three";
import { TransformControls as TransformControlsImpl } from "three/addons/controls/TransformControls.js";

import type { Transform } from "../scene/types";
import { useSceneStore } from "../state/sceneStore";

const MIN_SCALE = 0.01;
const TRANSLATION_SNAP = 0.25;
const ROTATION_SNAP = Math.PI / 12;
const SCALE_SNAP = 0.1;

type ToggleableControls = { enabled: boolean };
type GizmoCollections = { translate: Object3D; scale: Object3D };
type TransformGizmoNode = Object3D & {
  isTransformControlsGizmo?: boolean;
  gizmo?: GizmoCollections;
};

const axisCenter = new Vector3();

function removeNegativeAxisVisuals(root: Object3D) {
  const gizmo = root.children.find((child) => (child as TransformGizmoNode).isTransformControlsGizmo) as TransformGizmoNode | undefined;
  if (!gizmo?.gizmo) return;

  // Keep only the +X/+Y/+Z visible arrow/scale handles so their direction is
  // stable and meaningful. Deliberately leave TransformControls' invisible
  // picker geometry intact: removing half the pickers makes handles needlessly
  // difficult to grab from some camera angles.
  for (const mode of ["translate", "scale"] as const) {
    const collection = gizmo.gizmo[mode];
    for (const handle of [...collection.children]) {
      if (!(handle instanceof Mesh) || !["X", "Y", "Z"].includes(handle.name)) continue;
      handle.geometry.computeBoundingBox();
      const box = handle.geometry.boundingBox;
      if (!box) continue;
      box.getCenter(axisCenter);
      const coordinate = handle.name === "X" ? axisCenter.x : handle.name === "Y" ? axisCenter.y : axisCenter.z;
      if (coordinate >= -1e-6) continue;
      collection.remove(handle);
      handle.geometry.dispose();
    }
  }
}

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.matches("input, textarea, select") || target.isContentEditable);
}

function hasEnabled(value: unknown): value is ToggleableControls {
  return typeof value === "object" && value !== null && "enabled" in value && typeof value.enabled === "boolean";
}

/**
 * One viewport-level TransformControls instance that reattaches to whichever
 * scene object is selected. Keeping the controls persistent avoids stale DOM
 * listeners and attachment races when objects are added, removed or switched.
 */
export function TransformGizmo({ objectId, target, markDragged }: {
  objectId: string | null;
  target: Group | null;
  markDragged: () => void;
}) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const sceneControls = useThree((state) => state.controls);
  const defaultControls = hasEnabled(sceneControls) ? sceneControls : undefined;
  const mode = useSceneStore((state) => state.editor.transformMode);
  const space = useSceneStore((state) => state.editor.transformSpace);
  const snap = useSceneStore((state) => state.editor.snapEnabled);

  // Construct without a DOM element. TransformControls connects to the canvas
  // in an effect below, keeping DOM listener side effects out of React render.
  const controls = useMemo(() => new TransformControlsImpl(camera), [camera]);
  const helper = useMemo(() => {
    const next = controls.getHelper();
    removeNegativeAxisVisuals(next);
    return next;
  }, [controls]);

  const syncTransform = useCallback(() => {
    if (!objectId || !target) return;

    // TransformControls permits crossing through zero while scaling. The scene
    // format deliberately only permits positive scales, so keep both the live
    // Three.js object and the persisted transform valid.
    target.scale.set(
      Math.max(MIN_SCALE, target.scale.x),
      Math.max(MIN_SCALE, target.scale.y),
      Math.max(MIN_SCALE, target.scale.z),
    );

    const transform: Transform = {
      position: [target.position.x, target.position.y, target.position.z],
      rotation: [target.rotation.x, target.rotation.y, target.rotation.z],
      scale: [target.scale.x, target.scale.y, target.scale.z],
    };
    useSceneStore.getState().updateObjectTransform(objectId, transform);
  }, [objectId, target]);

  useEffect(() => {
    controls.connect(gl.domElement);
    return () => controls.disconnect();
  }, [controls, gl.domElement]);

  useLayoutEffect(() => {
    // If selection changes unexpectedly during a drag, fully end the old
    // pointer gesture before reattaching so camera controls cannot stay locked.
    if (controls.dragging) controls.pointerUp(null);
    controls.detach();
    if (target) controls.attach(target);
    return () => { controls.detach(); };
  }, [controls, target]);

  useLayoutEffect(() => {
    controls.setMode(mode);
    controls.setSpace(space);
    controls.setTranslationSnap(snap ? TRANSLATION_SNAP : null);
    controls.setRotationSnap(snap ? ROTATION_SNAP : null);
    controls.setScaleSnap(snap ? SCALE_SNAP : null);
    controls.setSize(0.85);
  }, [controls, mode, snap, space]);

  useEffect(() => {
    const onDraggingChanged = (event: { value: unknown }) => {
      if (defaultControls) defaultControls.enabled = !Boolean(event.value);
    };
    controls.addEventListener("dragging-changed", onDraggingChanged);
    return () => {
      controls.removeEventListener("dragging-changed", onDraggingChanged);
      if (defaultControls) defaultControls.enabled = true;
    };
  }, [controls, defaultControls]);

  useEffect(() => {
    const onMouseDown = () => {
      if (!objectId || !target) return;
      markDragged();
      useSceneStore.getState().beginEdit();
    };
    const onObjectChange = () => syncTransform();
    const onMouseUp = () => {
      if (!objectId || !target) return;
      markDragged();
      syncTransform();
      useSceneStore.getState().commitEdit();
    };

    controls.addEventListener("mouseDown", onMouseDown);
    controls.addEventListener("objectChange", onObjectChange);
    controls.addEventListener("mouseUp", onMouseUp);
    return () => {
      controls.removeEventListener("mouseDown", onMouseDown);
      controls.removeEventListener("objectChange", onObjectChange);
      controls.removeEventListener("mouseUp", onMouseUp);
    };
  }, [controls, markDragged, objectId, syncTransform, target]);

  useEffect(() => {
    const cancelActiveDrag = () => {
      if (!controls.dragging) return;
      controls.reset();
      useSceneStore.getState().cancelEdit();
      // reset() restores the object but intentionally keeps the pointer gesture
      // active. End it as well so the gizmo cannot resume moving after Escape
      // and OrbitControls is immediately re-enabled.
      controls.pointerUp(null);
      markDragged();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isTypingTarget(event.target)) return;
      if (!controls.dragging) return;
      event.preventDefault();
      cancelActiveDrag();
    };
    const onPointerCancel = () => cancelActiveDrag();
    const onBlur = () => cancelActiveDrag();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointercancel", onPointerCancel);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("blur", onBlur);
    };
  }, [controls, markDragged]);

  return <primitive object={helper} dispose={null} />;
}
