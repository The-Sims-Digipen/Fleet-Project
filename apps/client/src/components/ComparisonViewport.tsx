import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { MOUSE } from "three";

import type { ProjectDocument } from "../domain/project";
import { createProjectWorld, projectEntityReferenceKey } from "../scene/projectWorld";
import { ModelObject } from "./ModelObject";

function Camera({ reset }: { reset: number }) {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.set(17, 15, 24);
    camera.lookAt(0, 0, 0);
  }, [camera, reset]);

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

export function ComparisonViewport({ document, scenarioId, year, reset }: {
  document: ProjectDocument;
  scenarioId: string | null;
  year: number;
  reset: number;
}) {
  const objects = useMemo(() => createProjectWorld(document, year, scenarioId), [document, year, scenarioId]);
  const isClick = () => false;

  return <div
    role="img"
    className="absolute inset-0"
    aria-label={`${document.environment.vehicles.length} Project vehicles in ${scenarioId ? "the selected Scenario" : "the baseline fleet"} at ${year}`}
    onMouseDownCapture={(event) => { if (event.button === 1) event.preventDefault(); }}
    onAuxClickCapture={(event) => { if (event.button === 1) event.preventDefault(); }}
    onPointerDownCapture={(event) => { if (event.button === 1) event.preventDefault(); }}
  >
    <Canvas
      dpr={[1, 1.35]}
      camera={{ position: [17, 15, 24], fov: 42, near: 0.1, far: 200 }}
      shadows
      fallback={<div className="grid h-full place-items-center p-8 text-center text-secondary">WebGL is unavailable.</div>}
    >
      <color attach="background" args={["#07100f"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 14, 6]} intensity={1.6} castShadow />
      <directionalLight position={[-8, 7, -8]} intensity={0.45} />
      {objects.map((object) => <ModelObject key={projectEntityReferenceKey(object.reference)} object={object}
        isClick={isClick} selected={false} onSelect={() => undefined} />)}
      <Camera reset={reset} />
    </Canvas>
  </div>;
}
