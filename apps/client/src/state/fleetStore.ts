import { create } from "zustand";
import { END_YEAR, START_YEAR } from "./timelineStore";

export type MockVehicle = {
  vehicleId: string;
  vehicleName: string;
  annualDistance: number;
  plannedTransitionYear: number | null;
  currentPreset: string;
};

export const initialVehicles: MockVehicle[] = [
  { vehicleId: "UNIT-01", vehicleName: "City Delivery Van", annualDistance: 28000, plannedTransitionYear: 2027, currentPreset: "diesel-van" },
  { vehicleId: "UNIT-02", vehicleName: "Regional Hauler", annualDistance: 54000, plannedTransitionYear: 2029, currentPreset: "diesel-box-truck" },
  { vehicleId: "UNIT-03", vehicleName: "Urban Courier", annualDistance: 19000, plannedTransitionYear: 2026, currentPreset: "electric-van" },
  { vehicleId: "UNIT-04", vehicleName: "Service Support", annualDistance: 32000, plannedTransitionYear: 2028, currentPreset: "hybrid-van" },
  { vehicleId: "UNIT-05", vehicleName: "Depot Shuttle", annualDistance: 24000, plannedTransitionYear: 2030, currentPreset: "diesel-van" },
  { vehicleId: "UNIT-06", vehicleName: "Long-haul Supply", annualDistance: 61000, plannedTransitionYear: 2031, currentPreset: "diesel-box-truck" },
];

type FleetState = {
  vehicles: MockVehicle[];
  assignPreset: (vehicleId: string, presetId: string) => void;
  setTransitionYear: (vehicleId: string, year: number | null) => void;
};

/** Shared mock fleet state for the fleet panel, timeline, and 3D preview. */
export const useFleetStore = create<FleetState>((set) => ({
  vehicles: initialVehicles,
  assignPreset: (vehicleId, presetId) => set((state) => ({
    vehicles: state.vehicles.map((vehicle) => vehicle.vehicleId === vehicleId ? { ...vehicle, currentPreset: presetId } : vehicle),
  })),
  setTransitionYear: (vehicleId, year) => {
    if (year !== null && (!Number.isInteger(year) || year < START_YEAR || year > END_YEAR)) return;
    set((state) => ({
      vehicles: state.vehicles.map((vehicle) => vehicle.vehicleId === vehicleId ? { ...vehicle, plannedTransitionYear: year } : vehicle),
    }));
  },
}));
