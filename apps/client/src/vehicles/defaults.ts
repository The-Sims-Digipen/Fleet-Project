import { copyPreset, type VehiclePreset } from "./types";

/**
 * Indicative synthetic seed presets. These are plausible planning figures, not
 * manufacturer specifications or suggested user defaults.
 *
 * Every preset currently uses the `van` model because it is the only registered
 * geometry; see docs/tech/extending-the-editor.md to add more.
 */
const seeds: readonly VehiclePreset[] = [
  {
    id: "diesel-van",
    name: "Diesel Delivery Van",
    category: "Van",
    propulsion: "diesel",
    modelId: "van",
    litresPer100Km: 9.5,
    kWhPer100Km: 0,
    batteryCapacityKWh: 0,
    chargingPowerKW: 0,
    purchaseCost: 32000,
  },
  {
    id: "electric-van",
    name: "Electric Delivery Van",
    category: "Van",
    propulsion: "electric",
    modelId: "van",
    litresPer100Km: 0,
    kWhPer100Km: 22,
    batteryCapacityKWh: 64,
    chargingPowerKW: 11,
    purchaseCost: 45000,
  },
  {
    id: "hybrid-van",
    name: "Hybrid Delivery Van",
    category: "Van",
    propulsion: "hybrid",
    modelId: "van",
    litresPer100Km: 5.4,
    kWhPer100Km: 12,
    batteryCapacityKWh: 14,
    chargingPowerKW: 7.4,
    purchaseCost: 38500,
  },
  {
    id: "diesel-box-truck",
    name: "Diesel Box Truck",
    category: "Box truck",
    propulsion: "diesel",
    modelId: "van",
    litresPer100Km: 14.2,
    kWhPer100Km: 0,
    batteryCapacityKWh: 0,
    chargingPowerKW: 0,
    purchaseCost: 58000,
  },
  {
    id: "electric-box-truck",
    name: "Electric Box Truck",
    category: "Box truck",
    propulsion: "electric",
    modelId: "van",
    litresPer100Km: 0,
    kWhPer100Km: 38,
    batteryCapacityKWh: 120,
    chargingPowerKW: 22,
    purchaseCost: 79000,
  },
];

/**
 * The single seam between preset data and its source. F09 replaces this body
 * with an API call; nothing else in the feature changes.
 */
export const loadDefaultPresets = (): VehiclePreset[] => seeds.map(copyPreset);
