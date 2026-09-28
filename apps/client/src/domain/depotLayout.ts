import type { FleetVehicle, ParkingLotId } from "./contracts";
import type { Transform } from "../scene/types";

export const PROJECT_FLEET_CAPACITY = 10;

export type ParkingLot = {
  id: ParkingLotId;
  label: string;
  transform: Transform;
};

const positions: Array<[number, number]> = [
  [-6.4, -7], [-3.2, -7], [0, -7], [3.2, -7], [6.4, -7],
  [-6.4, 1], [-3.2, 1], [0, 1], [3.2, 1], [6.4, 1],
];

export const DEFAULT_PARKING_LOTS: readonly ParkingLot[] = positions.map(([x, z], index) => ({
  id: `parking-lot-${String(index + 1).padStart(2, "0")}`,
  label: `Parking Lot ${String(index + 1).padStart(2, "0")}`,
  transform: { position: [x, 0, z], rotation: [0, 0, 0], scale: [1, 1, 1] },
}));

/** Ordered world-space construction inputs for version 5 Vehicles. */
export const DEFAULT_VEHICLE_SPAWN_TRANSFORMS: readonly Transform[] = DEFAULT_PARKING_LOTS.map(({ transform }) => ({
  position: [...transform.position],
  rotation: [...transform.rotation],
  scale: [...transform.scale],
}));

const parkingLotsById = new Map(DEFAULT_PARKING_LOTS.map((parkingLot) => [parkingLot.id, parkingLot]));

export function isParkingLotId(value: unknown): value is ParkingLotId {
  return typeof value === "string" && parkingLotsById.has(value);
}

export function parkingLotById(id: ParkingLotId): ParkingLot | undefined {
  return parkingLotsById.get(id);
}

export function firstAvailableParkingLot(vehicles: readonly FleetVehicle[]): ParkingLot | undefined {
  const occupied = new Set(vehicles.map((vehicle) => vehicle.parkingLotId));
  return DEFAULT_PARKING_LOTS.find((parkingLot) => !occupied.has(parkingLot.id));
}

export function hasValidParkingAssignments(vehicles: readonly FleetVehicle[]): boolean {
  if (vehicles.length > PROJECT_FLEET_CAPACITY) return false;
  const occupied = new Set<ParkingLotId>();
  for (const vehicle of vehicles) {
    if (!isParkingLotId(vehicle.parkingLotId) || occupied.has(vehicle.parkingLotId)) return false;
    occupied.add(vehicle.parkingLotId);
  }
  return true;
}
