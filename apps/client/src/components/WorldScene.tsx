import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MOUSE, type Group } from "three";
import type { SceneObject } from "../scene/types";
import { useSceneStore } from "../state/sceneStore";
import { ModelObject } from "./ModelObject";
import { TransformGizmo } from "./TransformGizmo";

function Lighting() {
  const light = useSceneStore((state) => state.document.light);
  return <><ambientLight intensity={0.35 + light / 100} /><directionalLight position={[6, 9, 5]} intensity={0.5 + light / 45} /></>;
}

function CameraControls({ reset, fleetCount }: { reset: number; fleetCount: number | null }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  useEffect(() => {
    if (fleetCount !== null) {
      const rowWidth = Math.max(5, (fleetCount - 1) * 4.5 + 3);
      const aspect = size.width / Math.max(1, size.height);
      const distance = Math.max(16, rowWidth / (2 * Math.tan(42 * Math.PI / 360) * aspect) * 1.25);
      camera.position.set(0, distance * 0.42, distance);
    } else {
      camera.position.set(8, 7, 9);
    }
    camera.lookAt(0, 0, 0);
  }, [camera, fleetCount, reset, size.width, size.height]);
  return <OrbitControls
    key={`${reset}-${fleetCount === null ? "scene" : "fleet"}`}
    makeDefault
    enableDamping
    dampingFactor={0.06}
    minDistance={2}
    maxDistance={fleetCount === null ? 60 : 120}
    maxPolarAngle={Math.PI / 2.02}
    target={[0, 0, 0]}
    mouseButtons={fleetCount === null ? { LEFT: -1 as MOUSE, MIDDLE: MOUSE.ROTATE, RIGHT: -1 as MOUSE } : undefined}
  />;
}

type RegisteredTarget = { id: string; group: Group };

function WorldObjectsLayer({ objects, isClick, markDragged }: {
  objects: SceneObject[];
  isClick: () => boolean;
  markDragged: () => void;
}) {
  const selectedId = useSceneStore((state) => state.editor.selectedObjectId);
  const roots = useRef(new Map<string, Group>());
  const [registeredTarget, setRegisteredTarget] = useState<RegisteredTarget | null>(null);

  const registerRoot = useCallback((id: string, group: Group | null) => {
    if (group) {
      roots.current.set(id, group);
      if (useSceneStore.getState().editor.selectedObjectId === id) {
        setRegisteredTarget((current) => current?.id === id && current.group === group ? current : { id, group });
      }
      return;
    }

    roots.current.delete(id);
    setRegisteredTarget((current) => current?.id === id ? null : current);
  }, []);

  // Selection can change independently of mounting (sidebar selection, undo,
  // object creation). Resolve the selected logical object to its live Three.js
  // root after refs have been committed.
  useLayoutEffect(() => {
    const group = selectedId ? roots.current.get(selectedId) : undefined;
    setRegisteredTarget((current) => {
      if (!selectedId || !group) return current === null ? current : null;
      if (current?.id === selectedId && current.group === group) return current;
      return { id: selectedId, group };
    });
  }, [selectedId, objects.length]);

  const selectedTarget = selectedId && registeredTarget?.id === selectedId ? registeredTarget.group : null;

  return <>
    {objects.map((object) => <ModelObject key={object.id} object={object} isClick={isClick} registerRoot={registerRoot} />)}
    <TransformGizmo objectId={selectedId} target={selectedTarget} markDragged={markDragged} />
  </>;
}

export function WorldScene({ cameraReset, fleetPreview }: { cameraReset: number; fleetPreview: SceneObject[] | null }) {
  const objects = useSceneStore((state) => state.document.objects);
  // Track the full pointer path: returning to the start after orbiting is still a drag.
  const gesture = useRef({ x: 0, y: 0, dragged: false, primary: false });
  const isClick = useCallback(() => gesture.current.primary && !gesture.current.dragged, []);
  const markDragged = useCallback(() => { gesture.current.dragged = true; }, []);
  return <div className="absolute inset-0 [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full"
    onPointerDownCapture={(event) => { gesture.current = { x: event.clientX, y: event.clientY, dragged: false, primary: event.button === 0 }; }}
    onPointerMoveCapture={(event) => { if (Math.hypot(event.clientX - gesture.current.x, event.clientY - gesture.current.y) > 4) gesture.current.dragged = true; }}
    onPointerCancelCapture={markDragged}>
    <p className="sr-only">{fleetPreview ? `3D fleet preview with ${fleetPreview.length} vehicles arranged side by side.` : "Interactive 3D world containing procedural models. The World Objects list provides keyboard selection."}</p>
    <Canvas dpr={[1, 1.5]} camera={{ position: [8, 7, 9], fov: 42, near: 0.1, far: 200 }}
      fallback={<div className="grid h-full place-items-center p-8 text-center text-secondary">WebGL is unavailable. The sidebar remains usable.</div>}
      onPointerMissed={() => { if (!fleetPreview && isClick()) useSceneStore.getState().selectObject(null); }}>
      <color attach="background" args={["#07100f"]} />
      <Lighting />
      {fleetPreview
        ? fleetPreview.map((object) => <ModelObject key={object.id} object={object} isClick={isClick} selectable={false} />)
        : <WorldObjectsLayer objects={objects} isClick={isClick} markDragged={markDragged} />}
      {fleetPreview?.map((object) => <Html key={`${object.id}-label`} position={[object.transform.position[0], 2.8, object.transform.position[2]]} center style={{ pointerEvents: "none" }}>
        <span className="whitespace-nowrap rounded border border-line-strong bg-panel/90 px-2 py-1 font-mono text-xs text-primary">{object.name}</span>
      </Html>)}
      <CameraControls reset={cameraReset} fleetCount={fleetPreview?.length ?? null} />
    </Canvas>
  </div>;
}
