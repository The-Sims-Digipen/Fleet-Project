import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { MOUSE } from "three";
import { createObject } from "../scene/catalog";
import type { SceneObject } from "../scene/types";
import { ModelObject } from "./ModelObject";

export type DemoPlanKey = "gradual" | "accelerated";

const START_YEAR = 2026;
const END_YEAR = 2035;

const PARKING_BAYS: Array<[number, number]> = [
  [-6.4, -7],
  [-3.2, -7],
  [0, -7],
  [3.2, -7],
  [6.4, -7],
  [-6.4, 1],
  [-3.2, 1],
  [0, 1],
  [3.2, 1],
  [6.4, 1],
];

const ROADMAPS: Record<DemoPlanKey, number[]> = {
  gradual: [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
  accelerated: [2, 2, 1, 1, 2, 1, 1, 0, 0, 0],
};

const ELECTRIFICATION_ORDER: Record<DemoPlanKey, number[]> = {
  gradual: [0, 4, 6, 9, 1, 5, 2, 8, 3, 7],
  accelerated: [0, 1, 2, 4, 5, 6, 8, 9, 3, 7],
};

function Camera({ reset }: { reset: number }) {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.set(17, 15, 24);
    camera.lookAt(0, 0, -0.5);
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

function tintFor(type: "diesel" | "electric") {
  return type === "electric" ? "#3b82f6" : "#22c55e";
}

function electricCountAtYear(plan: DemoPlanKey, year: number) {
  const clampedYear = Math.max(START_YEAR, Math.min(END_YEAR, year));
  const index = clampedYear - START_YEAR;
  return Math.min(10, ROADMAPS[plan].slice(0, index + 1).reduce((total, count) => total + count, 0));
}

export function buildDemoFleetObjects(plan: DemoPlanKey, year = 2030): SceneObject[] {
  const electricCount = electricCountAtYear(plan, year);
  const electricIndices = new Set(ELECTRIFICATION_ORDER[plan].slice(0, electricCount));

  return PARKING_BAYS.map(([x, z], index) => {
    const type = electricIndices.has(index) ? "electric" : "diesel";
    const object = createObject("van", `demo-${plan}-van-${index + 1}`, undefined, `Vehicle ${index + 1}`)!;
    object.transform.position = [x, 0, z];
    // The depot building is at +Z and the van model faces -Z, so a zero
    // Y rotation points every parked van away from the depot.
    object.transform.rotation = [0, 0, 0];
    object.appearance = { tint: tintFor(type) };
    return object;
  });
}

export function ComparisonViewport({ plan, year, reset }: { plan: DemoPlanKey; year: number; reset: number }) {
  const depot = useMemo(() => createObject("depot", `demo-${plan}-depot`, undefined, "Fleet depot")!, [plan]);
  const fleetObjects = useMemo(() => buildDemoFleetObjects(plan, year), [plan, year]);
  const isClick = () => false;

  return <div
    className="absolute inset-0"
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
      <ModelObject object={depot} isClick={isClick} selectable={false} />
      {fleetObjects.map((object) => <ModelObject key={object.id} object={object} isClick={isClick} selectable={false} />)}
      <Camera reset={reset} />
    </Canvas>
  </div>;
}
