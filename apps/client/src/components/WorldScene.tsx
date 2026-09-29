import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { MOUSE, type Group } from "three";
import { createProjectWorld, worldObjectReferenceKey, type WorldObjectReference, type WorldObjectView } from "../scene/projectWorld";
import { useProjectStore } from "../state/projectStore";
import { ModelObject } from "./ModelObject";
import { TransformGizmo } from "./TransformGizmo";

function Lighting() {
  const light = useProjectStore((state) => state.runtime.editor.lightIntensity);
  return <><ambientLight intensity={0.35 + light / 100} /><directionalLight position={[6, 9, 5]} intensity={0.5 + light / 45} /></>;
}

function CameraControls() {
  const camera = useThree((state) => state.camera);
  const session = useProjectStore((state) => state.session);
  const cameraRevision = useProjectStore((state) => state.runtime.editor.cameraRevision);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);

  useLayoutEffect(() => {
    const next = useProjectStore.getState().runtime.editor.camera;
    camera.position.fromArray(next.position);
    if (controls.current) {
      controls.current.target.fromArray(next.target);
      controls.current.update();
    } else {
      camera.lookAt(...next.target);
    }
  }, [camera, cameraRevision, session]);

  const synchronizeCamera = useCallback(() => {
    if (!controls.current) return;
    useProjectStore.getState().setCamera({
      position: camera.position.toArray() as [number, number, number],
      target: controls.current.target.toArray() as [number, number, number],
    });
  }, [camera]);

  return <OrbitControls
    ref={controls}
    makeDefault
    enableDamping
    dampingFactor={0.06}
    minDistance={2}
    maxDistance={60}
    maxPolarAngle={Math.PI / 2.02}
    onChange={synchronizeCamera}
    mouseButtons={{ LEFT: -1 as MOUSE, MIDDLE: MOUSE.ROTATE, RIGHT: -1 as MOUSE }}
  />;
}

type RegisteredTarget = { key: string; group: Group };

function WorldObjectsLayer({ objects, isClick, markDragged }: {
  objects: readonly WorldObjectView[];
  isClick: () => boolean;
  markDragged: () => void;
}) {
  const selection = useProjectStore((state) => state.runtime.editor.selection);
  const selectedKey = selection ? worldObjectReferenceKey(selection) : null;
  const interactionMode = useProjectStore((state) => state.runtime.editor.interactionMode);
  const roots = useRef(new Map<string, Group>());
  const [registeredTarget, setRegisteredTarget] = useState<RegisteredTarget | null>(null);

  const registerRoot = useCallback((reference: WorldObjectReference, group: Group | null) => {
    const key = worldObjectReferenceKey(reference);
    if (group) {
      roots.current.set(key, group);
      const currentSelection = useProjectStore.getState().runtime.editor.selection;
      if (currentSelection && worldObjectReferenceKey(currentSelection) === key) {
        setRegisteredTarget((current) => current?.key === key && current.group === group ? current : { key, group });
      }
      return;
    }

    roots.current.delete(key);
    setRegisteredTarget((current) => current?.key === key ? null : current);
  }, []);

  // Selection can change independently of mounting (sidebar selection, undo,
  // object creation). Resolve its typed Project reference to a live Three.js root.
  useLayoutEffect(() => {
    const group = selectedKey ? roots.current.get(selectedKey) : undefined;
    setRegisteredTarget((current) => {
      if (!selectedKey || !group) return current === null ? current : null;
      if (current?.key === selectedKey && current.group === group) return current;
      return { key: selectedKey, group };
    });
  }, [selectedKey, objects.length]);

  const selectedTarget = selectedKey && registeredTarget?.key === selectedKey ? registeredTarget.group : null;

  return <>
    {objects.map((object) => {
      const referenceKey = worldObjectReferenceKey(object.reference);
      const canSelect = import.meta.env.DEV || interactionMode === "inspect";
      return <ModelObject key={referenceKey} object={object} isClick={isClick} selected={selectedKey === referenceKey}
        onSelect={() => {
          if (canSelect) useProjectStore.getState().selectObject(object.reference);
        }} registerRoot={import.meta.env.DEV ? registerRoot : undefined} />;
    })}
    {import.meta.env.DEV && interactionMode === "gizmo" && <TransformGizmo object={selection} target={selectedTarget} markDragged={markDragged} />}
  </>;
}

export function WorldScene() {
  const document = useProjectStore((state) => state.runtime.document);
  const selectedYear = useProjectStore((state) => state.runtime.editor.selectedYear);
  const objects = useMemo(() => createProjectWorld(document, selectedYear), [document, selectedYear]);
  // Track the full pointer path: returning to the start after orbiting is still a drag.
  const gesture = useRef({ x: 0, y: 0, dragged: false, primary: false });
  const isClick = useCallback(() => gesture.current.primary && !gesture.current.dragged, []);
  const markDragged = useCallback(() => { gesture.current.dragged = true; }, []);
  return <div className="absolute inset-0 [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full"
    onMouseDownCapture={(event) => { if (event.button === 1) event.preventDefault(); }}
    onAuxClickCapture={(event) => { if (event.button === 1) event.preventDefault(); }}
    onPointerDownCapture={(event) => {
      // Middle mouse belongs to the viewport camera. Suppress Chromium/Firefox's native
      // auto-scroll action before OrbitControls handles the same gesture.
      if (event.button === 1) event.preventDefault();
      gesture.current = { x: event.clientX, y: event.clientY, dragged: false, primary: event.button === 0 };
    }}
    onPointerMoveCapture={(event) => { if (Math.hypot(event.clientX - gesture.current.x, event.clientY - gesture.current.y) > 4) gesture.current.dragged = true; }}
    onPointerCancelCapture={markDragged}>
    <p className="sr-only">Project depot with {document.environment.vehicles.length} fleet vehicles.</p>
    <Canvas dpr={[1, 1.5]} camera={{ position: [8, 7, 9], fov: 42, near: 0.1, far: 200 }}
      fallback={<div className="grid h-full place-items-center p-8 text-center text-secondary">WebGL is unavailable. The sidebar remains usable.</div>}
      onPointerMissed={() => { if (isClick()) useProjectStore.getState().selectObject(null); }}>
      <color attach="background" args={["#07100f"]} />
      <Lighting />
      <WorldObjectsLayer objects={objects} isClick={isClick} markDragged={markDragged} />
      <CameraControls />
    </Canvas>
  </div>;
}
