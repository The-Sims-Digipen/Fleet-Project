import type { Transform } from "../scene/types";

export const PROJECT_FLEET_CAPACITY = 10;

const positions: Array<[number, number]> = [
  [-6.4, -7], [-3.2, -7], [0, -7], [3.2, -7], [6.4, -7],
  [-6.4, 1], [-3.2, 1], [0, 1], [3.2, 1], [6.4, 1],
];

/** Ordered world-space construction inputs for newly created Project Vehicles. */
export const DEFAULT_VEHICLE_SPAWN_TRANSFORMS: readonly Transform[] = positions.map(([x, z]) => ({
  position: [x, 0, z],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
}));
