import { TransformControls } from "@react-three/drei";
import { useEffect, useRef, type ElementRef, type RefObject } from "react";
import type { Group } from "three";

import type { SceneObject, Transform } from "../scene/types";
import { useSceneStore } from "../state/sceneStore";

const MIN_SCALE = 0.01;
const TRANSLATION_SNAP = 0.25;
const ROTATION_SNAP = Math.PI / 12;
const SCALE_SNAP = 0.1;

export function TransformGizmo({ object, target, markDragged }: {
  object: SceneObject;
  target: RefObject<Group>;
  markDragged: () => void;
}) {
  const mode = useSceneStore((state) => state.editor.transformMode);
  const space = useSceneStore((state) => state.editor.transformSpace);
  const snap = useSceneStore((state) => state.editor.snapEnabled);
  const controls = useRef<ElementRef<typeof TransformControls>>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const current = controls.current;
      if (event.key !== "Escape" || !current?.dragging) return;
      event.preventDefault();
      current.reset();
      useSceneStore.getState().cancelEdit();
      markDragged();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [markDragged]);

  const syncTransform = () => {
    const group = target.current;
    if (!group) return;
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
  };

  return <TransformControls
    ref={controls}
    object={target}
    mode={mode}
    space={space}
    translationSnap={snap ? TRANSLATION_SNAP : null}
    rotationSnap={snap ? ROTATION_SNAP : null}
    scaleSnap={snap ? SCALE_SNAP : null}
    size={0.85}
    onMouseDown={() => {
      markDragged();
      useSceneStore.getState().beginEdit();
    }}
    onObjectChange={syncTransform}
    onMouseUp={() => {
      markDragged();
      syncTransform();
      useSceneStore.getState().commitEdit();
    }}
  />;
}
