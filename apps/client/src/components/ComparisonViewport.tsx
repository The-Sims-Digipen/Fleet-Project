import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { MOUSE } from "three";
import { createObject } from "../scene/catalog";
import type { SceneDocument, SceneObject } from "../scene/types";
import { effectivePresetForYear, resolveVehiclePlan } from "../project/comparisonModel";
import type { Scenario } from "../project/types";
import type { MockVehicle } from "../state/fleetStore";
import type { VehiclePreset } from "../vehicles/types";
import { ModelObject } from "./ModelObject";

function Camera({ reset, fleetCount }: { reset: number; fleetCount: number }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(fleetCount))));
  const rows = Math.max(1, Math.ceil(fleetCount / columns));
  const targetZ = 4 + (rows - 1) * 2.2;
  useEffect(() => {
    const rowWidth = Math.max(12, (columns - 1) * 3.4 + 7);
    const aspect = size.width / Math.max(1, size.height);
    const distance = Math.max(18, rowWidth / (2 * Math.tan(42 * Math.PI / 360) * Math.max(0.8, aspect)) * 1.05);
    camera.position.set(10, distance * 0.55, targetZ + distance);
    camera.lookAt(0, 0, targetZ);
  }, [camera, columns, reset, size.height, size.width, targetZ]);
  return <OrbitControls
    key={reset}
    makeDefault
    enableDamping
    dampingFactor={0.06}
    minDistance={3}
    maxDistance={100}
    maxPolarAngle={Math.PI / 2.02}
    target={[0, 0, targetZ]}
    mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.PAN, RIGHT: -1 as MOUSE }}
  />;
}

function tintFor(propulsion: VehiclePreset["propulsion"], changed: boolean) {
  if (propulsion === "electric") return changed ? "#39ff14" : "#85d8ff";
  if (propulsion === "hybrid") return "#f5d18a";
  return "#ffffff";
}

export function buildComparisonFleetObjects(scenario: Scenario, vehicles: MockVehicle[], presets: VehiclePreset[], year: number): SceneObject[] {
  return vehicles.flatMap((vehicle, index) => {
    const preset = effectivePresetForYear(scenario, vehicle, presets, year);
    if (!preset) return [];
    const plan = resolveVehiclePlan(scenario, vehicle, presets);
    const changed = plan.transitionYear !== null && year >= plan.transitionYear && plan.targetPresetId !== vehicle.currentPreset;
    const object = createObject(preset.modelId || "van", `compare-${scenario.id}-${vehicle.vehicleId}`, preset.id, vehicle.vehicleName);
    if (!object) return [];
    const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(vehicles.length))));
    const row = Math.floor(index / columns);
    const column = index % columns;
    object.transform.position = [(column - (columns - 1) / 2) * 3.4, 0, 4 + row * 4.4];
    object.appearance = { tint: tintFor(preset.propulsion, changed) };
    return [object];
  });
}

export function ComparisonViewport({ world, scenario, vehicles, presets, year, reset }: {
  world: SceneDocument;
  scenario: Scenario;
  vehicles: MockVehicle[];
  presets: VehiclePreset[];
  year: number;
  reset: number;
}) {
  const fleetObjects = useMemo(() => buildComparisonFleetObjects(scenario, vehicles, presets, year), [scenario, vehicles, presets, year]);
  const isClick = () => false;
  return <div className="absolute inset-0"
    onMouseDownCapture={(event) => { if (event.button === 1) event.preventDefault(); }}
    onAuxClickCapture={(event) => { if (event.button === 1) event.preventDefault(); }}>
    <Canvas dpr={[1, 1.35]} camera={{ position: [10, 9, 18], fov: 42, near: 0.1, far: 200 }}
      fallback={<div className="grid h-full place-items-center p-8 text-center text-secondary">WebGL is unavailable.</div>}>
      <color attach="background" args={["#07100f"]} />
      <ambientLight intensity={0.35 + world.light / 100} />
      <directionalLight position={[6, 9, 5]} intensity={0.5 + world.light / 45} />
      {world.objects.map((object) => <ModelObject key={`world-${object.id}`} object={object} isClick={isClick} selectable={false} />)}
      {fleetObjects.map((object) => <ModelObject key={object.id} object={object} isClick={isClick} selectable={false} />)}
      <gridHelper args={[36, 18, "#355149", "#1a2a26"]} position={[0, -0.02, 4]} />
      <Camera reset={reset} fleetCount={fleetObjects.length} />
    </Canvas>
  </div>;
}
