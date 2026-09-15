import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { MOUSE, type Group } from "three";
import type { SceneObject } from "../scene/types";
import { useSceneStore } from "../state/sceneStore";
import { ModelObject } from "./ModelObject";
import { TransformGizmo } from "./TransformGizmo";

function Lighting() {
  const light = useSceneStore((state) => state.document.light);
  return <><ambientLight intensity={0.35 + light / 100} /><directionalLight position={[6, 9, 5]} intensity={0.5 + light / 45} /></>;
}

function CameraControls({ reset }: { reset: number }) {
  const camera = useThree((state) => state.camera);
  useEffect(() => { camera.position.set(8, 7, 9); camera.lookAt(0, 0, 0); }, [camera, reset]);
  return <OrbitControls
    key={reset}
    makeDefault
    enableDamping
    dampingFactor={0.06}
    minDistance={2}
    maxDistance={60}
    maxPolarAngle={Math.PI / 2.02}
    target={[0, 0, 0]}
    mouseButtons={{ LEFT: -1 as MOUSE, MIDDLE: MOUSE.ROTATE, RIGHT: -1 as MOUSE }}
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

export function WorldScene({ cameraReset }: { cameraReset: number }) {
  const objects = useSceneStore((state) => state.document.objects);
  // Track the full pointer path: returning to the start after orbiting is still a drag.
  const gesture = useRef({ x: 0, y: 0, dragged: false, primary: false });
  const isClick = useCallback(() => gesture.current.primary && !gesture.current.dragged, []);
  const markDragged = useCallback(() => { gesture.current.dragged = true; }, []);
  return <div className="absolute inset-0 [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full"
    onPointerDownCapture={(event) => { gesture.current = { x: event.clientX, y: event.clientY, dragged: false, primary: event.button === 0 }; }}
    onPointerMoveCapture={(event) => { if (Math.hypot(event.clientX - gesture.current.x, event.clientY - gesture.current.y) > 4) gesture.current.dragged = true; }}
    onPointerCancelCapture={markDragged}>
    <p className="sr-only">Interactive 3D world containing procedural models. The World Objects list provides keyboard selection.</p>
    <Canvas dpr={[1, 1.5]} camera={{ position: [8, 7, 9], fov: 42, near: 0.1, far: 200 }}
      fallback={<div className="grid h-full place-items-center p-8 text-center text-secondary">WebGL is unavailable. The sidebar remains usable.</div>}
      onPointerMissed={() => { if (isClick()) useSceneStore.getState().selectObject(null); }}>
      <color attach="background" args={["#07100f"]} />
      <Lighting />
      <WorldObjectsLayer objects={objects} isClick={isClick} markDragged={markDragged} />
      <CameraControls reset={cameraReset} />
    </Canvas>
  </div>;
}
