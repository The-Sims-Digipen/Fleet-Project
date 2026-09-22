import { describe, expect, it } from "vitest";
import { createObject } from "../scene/catalog";
import { normalizeFleetVehicle } from "./fleet";
import { createMockFleet, createMockPresets } from "./mockProject";
import { fleetFromObjects, isVehicleObject, newVehicleData, placeMigratedFleet, placeVehicle, toFleetVehicle } from "./worldFleet";

const presets = createMockPresets();
const dieselVan = presets.find((preset) => preset.id === "diesel-van")!;
const presetIds = new Set(presets.map((preset) => preset.id));

describe("what counts as a vehicle", () => {
  it("recognises a preset placement", () => {
    const object = placeVehicle(dieselVan, "vehicle-1", [])!;
    expect(isVehicleObject(object)).toBe(true);
    expect(fleetFromObjects([object])).toHaveLength(1);
  });

  it("ignores plain scenery placed from the catalog", () => {
    const scenery = createObject("van", "scenery-1")!;
    expect(isVehicleObject(scenery)).toBe(false);
    expect(fleetFromObjects([scenery])).toEqual([]);
  });

  it("ignores planning data on an object with no preset, so scenery cannot smuggle a vehicle in", () => {
    const orphan = { ...createObject("van", "orphan-1")!, vehicle: newVehicleData() };
    expect(isVehicleObject(orphan)).toBe(false);
    expect(fleetFromObjects([orphan])).toEqual([]);
  });
});

describe("deriving a fleet vehicle", () => {
  it("takes identity and preset from the object and planning data from its vehicle field", () => {
    const object = placeVehicle(dieselVan, "vehicle-1", [])!;
    const vehicle = toFleetVehicle(object as Parameters<typeof toFleetVehicle>[0]);

    expect(vehicle).toMatchObject({ id: "vehicle-1", name: dieselVan.name, currentPresetId: dieselVan.id });
    // A derived vehicle must satisfy the same rules as a stored one.
    expect(normalizeFleetVehicle(vehicle, presetIds)).toBeDefined();
  });

  it("copies holding terms so the derived vehicle cannot write back into the scene", () => {
    const object = placeVehicle(dieselVan, "vehicle-1", [])!;
    const vehicle = toFleetVehicle(object as Parameters<typeof toFleetVehicle>[0]);
    vehicle.currentHolding = { kind: "leased", annualPayment: 99, exitFee: 99 };
    expect(object.vehicle?.currentHolding).toEqual({ kind: "owned", currentValue: 0, endResidualValue: 0 });
  });

  it("starts a placed vehicle with neutral values rather than invented ones", () => {
    const object = placeVehicle(dieselVan, "vehicle-1", [])!;
    expect(object.vehicle).toMatchObject({ annualKm: 0, typicalDailyKm: 0, replacementYear: null });
  });

  it("preserves placement order", () => {
    const first = placeVehicle(dieselVan, "vehicle-1", [])!;
    const second = placeVehicle(dieselVan, "vehicle-2", [first])!;
    expect(fleetFromObjects([first, second]).map((vehicle) => vehicle.id)).toEqual(["vehicle-1", "vehicle-2"]);
    // The second lands clear of the first rather than inside it.
    expect(second.transform.position[0]).toBeGreaterThan(first.transform.position[0]);
  });
});

describe("rehoming a project-wide fleet into a depot", () => {
  it("places every vehicle, preserving ids so scenario plans keep resolving", () => {
    const fleet = createMockFleet();
    const placed = placeMigratedFleet(fleet, presets, []);

    expect(placed.map((object) => object.id)).toEqual(fleet.map((vehicle) => vehicle.id));
    expect(fleetFromObjects(placed)).toEqual(fleet);
  });

  it("lays them out clear of each other and of what is already in the depot", () => {
    const existing = [placeVehicle(dieselVan, "already-here", [])!];
    const placed = placeMigratedFleet(createMockFleet(), presets, existing);
    const columns = placed.map((object) => object.transform.position[0]);
    expect(new Set(columns).size).toBe(columns.length);
    expect(Math.min(...columns)).toBeGreaterThan(existing[0].transform.position[0]);
  });

  it("still places a vehicle whose preset has gone, falling back to catalog geometry", () => {
    const orphan = { ...createMockFleet()[0], currentPresetId: "deleted-preset" };
    const placed = placeMigratedFleet([orphan], presets, []);
    expect(placed).toHaveLength(1);
    expect(placed[0].presetId).toBe("deleted-preset");
  });
});
