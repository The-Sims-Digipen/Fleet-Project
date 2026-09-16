import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { MOUSE } from "three";
import { createObject } from "../scene/catalog";
import type { SceneObject } from "../scene/types";
import { ModelObject } from "./ModelObject";

export type DemoPlanKey = "gradual" | "accelerated";

const PARKING_BAYS: Array<[number, number, number]> = [
  [-6.4, -7, Math.PI],
  [-3.2, -7, Math.PI],
  [0, -7, Math.PI],
  [3.2, -7, Math.PI],
  [6.4, -7, Math.PI],
  [-6.4, 1, 0],
  [-3.2, 1, 0],
  [0, 1, 0],
  [3.2, 1, 0],
  [6.4, 1, 0],
];

const PLAN_FLEETS: Record<DemoPlanKey, Array<"diesel" | "hybrid" | "electric">> = {
  gradual: ["electric", "diesel", "diesel", "hybrid", "electric", "diesel", "electric", "hybrid", "diesel", "electric"],
  accelerated: ["electric", "electric", "electric", "hybrid", "electric", "electric", "electric", "diesel", "electric", "electric"],
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
    minDistance={10}
    maxDistance={60}
    maxPolarAngle={Math.PI / 2.03}
    target={[0, 0, -0.5]}
    mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.PAN, RIGHT: -1 as MOUSE }}
  />;
}

function tintFor(type: "diesel" | "hybrid" | "electric") {
  if (type === "electric") return "#55d6be";
  if (type === "hybrid") return "#d9ba63";
  return "#d7dfdc";
}

export function buildDemoFleetObjects(plan: DemoPlanKey): SceneObject[] {
  return PLAN_FLEETS[plan].map((type, index) => {
    const object = createObject("van", `demo-${plan}-van-${index + 1}`, undefined, `Vehicle ${index + 1}`)!;
    const [x, z, rotationY] = PARKING_BAYS[index];
    object.transform.position = [x, 0, z];
    object.transform.rotation = [0, rotationY, 0];
    object.appearance = { tint: tintFor(type) };
    return object;
  });
}

export function ComparisonViewport({ plan, reset }: { plan: DemoPlanKey; reset: number }) {
  const depot = useMemo(() => createObject("depot", `demo-${plan}-depot`, undefined, "Fleet depot")!, [plan]);
  const fleetObjects = useMemo(() => buildDemoFleetObjects(plan), [plan]);
  const isClick = () => false;

  return <div
    className="absolute inset-0"
    onMouseDownCapture={(event) => { if (event.button === 1) event.preventDefault(); }}
    onAuxClickCapture={(event) => { if (event.button === 1) event.preventDefault(); }}
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
