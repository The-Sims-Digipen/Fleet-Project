import { create } from "zustand";

import { vehicleModelEntries } from "../scene/catalog";
import { loadDefaultPresets } from "../vehicles/defaults";
import { copyPreset, normalizePreset, presetFileVersion, type PresetFile, type VehiclePreset } from "../vehicles/types";

// Re-exported so callers of the store need only one import.
export { presetFileVersion, type PresetFile };

export type ImportResult = { ok: true; count: number } | { ok: false; error: string };

const knownModelIds = (): ReadonlySet<string> => new Set(vehicleModelEntries.map(([id]) => id));
const firstModelId = () => vehicleModelEntries[0]?.[0] ?? "";

function blankPreset(id: string, name: string): VehiclePreset {
  return {
    id,
    name,
    category: "Van",
    propulsion: "diesel",
    modelId: firstModelId(),
    litresPer100Km: 0,
    kWhPer100Km: 0,
    batteryCapacityKWh: 0,
    chargingPowerKW: 0,
    purchaseCost: 0,
  };
}

type PresetState = {
  presets: VehiclePreset[];
  selectedPresetId: string | null;
  /** Snapshot taken when a continuous edit begins, so Escape can restore it. */
  baseline: VehiclePreset[] | null;
  selectPreset: (id: string | null) => void;
  createPreset: () => void;
  duplicatePreset: (id: string) => void;
  updatePreset: (id: string, patch: Partial<VehiclePreset>) => void;
  deletePreset: (id: string) => void;
  exportPresets: () => string;
  importPresets: (text: string) => ImportResult;
  replacePresets: (presets: VehiclePreset[]) => void;
  beginEdit: () => void;
  commitEdit: () => void;
  cancelEdit: () => void;
};

// Presets are project data, so they are held separately from the scene document
// and are not part of its undo history. See docs/tech/contracts.md.
export const usePresetStore = create<PresetState>((set, get) => {
  const replace = (presets: VehiclePreset[]) => {
    const selectedPresetId = presets.some((preset) => preset.id === get().selectedPresetId) ? get().selectedPresetId : null;
    set({ presets, selectedPresetId });
  };
  const uniqueName = (base: string) => {
    const taken = new Set(get().presets.map((preset) => preset.name));
    if (!taken.has(base)) return base;
    for (let index = 2; ; index += 1) if (!taken.has(`${base} ${index}`)) return `${base} ${index}`;
  };
  return {
    presets: loadDefaultPresets(),
    selectedPresetId: null,
    baseline: null,
    selectPreset: (id) => {
      get().commitEdit();
      if (id === null || get().presets.some((preset) => preset.id === id)) set({ selectedPresetId: id });
    },
    createPreset: () => {
      get().commitEdit();
      const preset = blankPreset(crypto.randomUUID(), uniqueName("New Preset"));
      if (!normalizePreset(preset, knownModelIds())) return;
      set({ presets: [...get().presets, preset], selectedPresetId: preset.id });
    },
    duplicatePreset: (id) => {
      get().commitEdit();
      const source = get().presets.find((preset) => preset.id === id);
      if (!source) return;
      const copy = { ...copyPreset(source), id: crypto.randomUUID(), name: uniqueName(`${source.name} copy`) };
      set({ presets: [...get().presets, copy], selectedPresetId: copy.id });
    },
    updatePreset: (id, patch) => {
      const current = get().presets.find((preset) => preset.id === id);
      if (!current) return;
      // Reject the whole edit when the patched record would be invalid, so a bad
      // draft never replaces valid inputs (docs/tech/contracts.md).
      const next = normalizePreset({ ...current, ...patch, id: current.id }, knownModelIds());
      if (!next) return;
      set({ presets: get().presets.map((preset) => (preset.id === id ? next : preset)) });
    },
    deletePreset: (id) => {
      get().commitEdit();
      replace(get().presets.filter((preset) => preset.id !== id));
    },
    exportPresets: () => JSON.stringify({ version: presetFileVersion, presets: get().presets } satisfies PresetFile, null, 2),
    replacePresets: (presets) => {
      get().commitEdit();
      replace(presets.map(copyPreset));
    },
    importPresets: (text) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { ok: false, error: "File is not valid JSON." };
      }
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return { ok: false, error: "File is not a preset library." };
      const file = parsed as Record<string, unknown>;
      if (file.version !== presetFileVersion) return { ok: false, error: `Unsupported file version ${String(file.version)}; expected ${presetFileVersion}.` };
      if (!Array.isArray(file.presets)) return { ok: false, error: "File has no preset list." };

      const known = knownModelIds();
      const imported: VehiclePreset[] = [];
      const seen = new Set<string>();
      for (const [index, record] of file.presets.entries()) {
        const preset = normalizePreset(record, known);
        if (!preset) return { ok: false, error: `Preset ${index + 1} is invalid or uses an unknown 3D model. Nothing was imported.` };
        if (seen.has(preset.id)) return { ok: false, error: `Preset ${index + 1} repeats id "${preset.id}". Nothing was imported.` };
        seen.add(preset.id);
        imported.push(preset);
      }

      get().commitEdit();
      replace(imported);
      return { ok: true, count: imported.length };
    },
    beginEdit: () => {
      if (!get().baseline) set({ baseline: get().presets });
    },
    commitEdit: () => {
      if (get().baseline) set({ baseline: null });
    },
    cancelEdit: () => {
      const baseline = get().baseline;
      if (!baseline) return;
      set({ baseline: null });
      replace(baseline);
    },
  };
});

/**
 * Geometry for a placed object: its preset's model when that resolves, else its
 * own definition. Returns a string so the selector stays referentially stable.
 */
export function useResolvedModelId(object: { definitionId: string; presetId?: string }): string {
  return usePresetStore(
    (state) => (object.presetId ? state.presets.find((preset) => preset.id === object.presetId)?.modelId : undefined) ?? object.definitionId,
  );
}

/**
 * Display name for a placed object: its preset's current name, else the name
 * stored at placement. Renaming a preset therefore relabels its instances,
 * while orphaned instances keep the name they were placed with.
 */
export function useResolvedName(object: { name: string; presetId?: string }): string {
  return usePresetStore(
    (state) => (object.presetId ? state.presets.find((preset) => preset.id === object.presetId)?.name : undefined) ?? object.name,
  );
}
