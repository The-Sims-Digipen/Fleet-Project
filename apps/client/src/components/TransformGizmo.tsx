import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useMemo, type RefObject } from "react";
import { Mesh, Vector3, type Group, type Object3D } from "three";
import { TransformControls as TransformControlsImpl } from "three/addons/controls/TransformControls.js";

import type { SceneObject, Transform } from "../scene/types";
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
  picker?: GizmoCollections;
};

const axisCenter = new Vector3();

function removeNegativeAxisHandles(root: Object3D) {
  const gizmo = root.children.find((child) => (child as TransformGizmoNode).isTransformControlsGizmo) as TransformGizmoNode | undefined;
  if (!gizmo?.gizmo || !gizmo.picker) return;

  // Blender-style direction semantics: X/Y/Z handles live on +X/+Y/+Z and
  // never jump to the opposite side just because the camera crossed an axis.
  // Plane and center handles are intentionally left untouched.
  for (const mode of ["translate", "scale"] as const) {
    for (const collection of [gizmo.gizmo[mode], gizmo.picker[mode]]) {
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
}

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.matches("input, textarea, select") || target.isContentEditable);
}

export function TransformGizmo({ object, target, markDragged }: {
  object: SceneObject;
  target: RefObject<Group>;
  markDragged: () => void;
}) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const defaultControls = useThree((state) => state.controls) as ToggleableControls | undefined;
  const mode = useSceneStore((state) => state.editor.transformMode);
  const space = useSceneStore((state) => state.editor.transformSpace);
  const snap = useSceneStore((state) => state.editor.snapEnabled);

  // Use Three's TransformControls directly instead of Drei's older three-stdlib
  // implementation. The latter camera-flips axis handles, which can make the
  // positive-axis arrow appear to point the wrong way.
  const controls = useMemo(() => new TransformControlsImpl(camera, gl.domElement), [camera, gl.domElement]);
  const helper = useMemo(() => {
    const next = controls.getHelper();
    removeNegativeAxisHandles(next);
    return next;
  }, [controls]);

  const syncTransform = useCallback(() => {
    const group = target.current;
    if (!group) return;

    // TransformControls permits crossing through zero while scaling. The scene
    // format deliberately only permits positive scales, so keep both the live
    // Three.js object and the persisted transform valid.
    group.scale.set(
      Math.max(MIN_SCALE, group.scale.x),
      Math.max(MIN_SCALE, group.scale.y),
      Math.max(MIN_SCALE, group.scale.z),
    );

    const transform: Transform = {
      position: [group.position.x, group.position.y, group.position.z],
      rotation: [group.rotation.x, group.rotation.y, group.rotation.z],
      scale: [group.scale.x, group.scale.y, group.scale.z],
    };
    useSceneStore.getState().updateObjectTransform(object.id, transform);
  }, [object.id, target]);

  useLayoutEffect(() => {
    const group = target.current;
    if (!group) return;
    controls.attach(group);
    return () => controls.detach();
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
      markDragged();
      useSceneStore.getState().beginEdit();
    };
    const onObjectChange = () => syncTransform();
    const onMouseUp = () => {
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
  }, [controls, markDragged, syncTransform]);

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

  useEffect(() => () => controls.dispose(), [controls]);

  return <primitive object={helper} dispose={null} />;
}
