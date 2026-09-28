import { beforeEach, describe, expect, it } from "vitest";
import { createMockAnalysis, createMockFleet, createMockPresets } from "../domain/mockProject";
import { PROJECT_FLEET_CAPACITY } from "../domain/depotLayout";
import { createFleetSceneObjects } from "../scene/fleetSceneObjects";
import { useFleetStore } from "../state/fleetStore";
import { usePresetStore } from "../state/presetStore";

beforeEach(() => {
  usePresetStore.getState().replacePresets(createMockPresets());
  useFleetStore.setState({ vehicles: createMockFleet(), analysis: createMockAnalysis(), baseline: null });
});

describe("Project-owned fleet rendering", () => {
  it("derives exactly one parked scene object per fleet vehicle", () => {
    const vehicles = useFleetStore.getState().vehicles;
    const objects = createFleetSceneObjects({
      vehicles,
      presets: usePresetStore.getState().presets,
      vehiclePlans: {},
      year: 2026,
    });
    expect(objects).toHaveLength(vehicles.length);
    expect(new Set(objects.map((object) => object.id)).size).toBe(vehicles.length);
    expect(new Set(objects.map((object) => object.transform.position.join(","))).size).toBe(vehicles.length);
  });

  it("renders a generic vehicle without a preset and changes only its appearance when assigned", () => {
    const id = useFleetStore.getState().createVehicle()!;
    const before = createFleetSceneObjects({
      vehicles: useFleetStore.getState().vehicles,
      presets: usePresetStore.getState().presets,
      vehiclePlans: {},
      year: 2026,
    }).find((object) => object.id === `fleet-${id}`)!;
    expect(before.appearance.tint).toBe("#87928f");

    useFleetStore.getState().updateVehicle(id, { presetId: "electric-van" });
    const after = createFleetSceneObjects({
      vehicles: useFleetStore.getState().vehicles,
      presets: usePresetStore.getState().presets,
      vehiclePlans: {},
      year: 2026,
    }).find((object) => object.id === `fleet-${id}`)!;
    expect(after.id).toBe(before.id);
    expect(after.transform).toEqual(before.transform);
    expect(after.appearance.tint).toBe("#85d8ff");
  });

  it("assigns each available lot once and refuses an eleventh vehicle", () => {
    while (useFleetStore.getState().vehicles.length < PROJECT_FLEET_CAPACITY) {
      expect(useFleetStore.getState().createVehicle()).not.toBeNull();
    }
    const vehicles = useFleetStore.getState().vehicles;
    expect(new Set(vehicles.map((vehicle) => vehicle.parkingLotId)).size).toBe(PROJECT_FLEET_CAPACITY);
    expect(useFleetStore.getState().createVehicle()).toBeNull();
    expect(useFleetStore.getState().vehicles).toHaveLength(PROJECT_FLEET_CAPACITY);
  });
});

