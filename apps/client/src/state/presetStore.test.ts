import { beforeEach, describe, expect, it } from "vitest";
import { loadDefaultPresets } from "../vehicles/defaults";
import { presetFileVersion, usePresetStore } from "./presetStore";

const state = usePresetStore.getState;
beforeEach(() => usePresetStore.setState({ presets: loadDefaultPresets(), selectedPresetId: null, baseline: null }));

describe("preset library", () => {
  it("creates, duplicates and deletes presets, clearing a stale selection", () => {
    const seeded = state().presets.length;
    state().createPreset();
    const created = state().selectedPresetId!;
    expect(state().presets).toHaveLength(seeded + 1);
    expect(created).toBeTruthy();

    state().duplicatePreset(created);
    const copy = state().presets.at(-1)!;
    expect(copy.id).not.toBe(created);
    expect(copy.name).not.toBe(state().presets.find((preset) => preset.id === created)!.name);

    state().selectPreset(created);
    state().deletePreset(created);
    expect(state().selectedPresetId).toBeNull();
    expect(state().presets.some((preset) => preset.id === created)).toBe(false);
    state().selectPreset("missing-id");
    expect(state().selectedPresetId).toBeNull();
  });

  it("applies valid patches and rejects invalid ones without replacing good inputs", () => {
    const target = state().presets[0];
    state().updatePreset(target.id, { name: "Renamed", purchaseCost: 12345 });
    expect(state().presets[0].name).toBe("Renamed");
    expect(state().presets[0].purchaseCost).toBe(12345);

    for (const patch of [{ purchaseCost: -1 }, { kWhPer100Km: Number.NaN }, { name: "" }, { modelId: "spaceship" }, { propulsion: "nuclear" as never }]) {
      state().updatePreset(target.id, patch);
    }
    expect(state().presets[0].name).toBe("Renamed");
    expect(state().presets[0].purchaseCost).toBe(12345);
    // Ids are immutable: a patch cannot repoint a record.
    state().updatePreset(target.id, { id: "hijacked" });
    expect(state().presets[0].id).toBe(target.id);
  });

  it("restores the baseline on cancel and keeps changes on commit", () => {
    const target = state().presets[0];
    state().beginEdit();
    state().updatePreset(target.id, { purchaseCost: 999 });
    expect(state().presets[0].purchaseCost).toBe(999);
    state().cancelEdit();
    expect(state().presets[0].purchaseCost).toBe(target.purchaseCost);

    state().beginEdit();
    state().updatePreset(target.id, { purchaseCost: 777 });
    state().commitEdit();
    expect(state().presets[0].purchaseCost).toBe(777);
    state().cancelEdit();
    expect(state().presets[0].purchaseCost).toBe(777);
  });

  it("round-trips an export and rejects bad imports atomically", () => {
    state().updatePreset(state().presets[0].id, { name: "Exported Van" });
    const exported = state().exportPresets();
    expect(JSON.parse(exported).version).toBe(presetFileVersion);

    usePresetStore.setState({ presets: [], selectedPresetId: null, baseline: null });
    expect(state().importPresets(exported)).toEqual({ ok: true, count: loadDefaultPresets().length });
    expect(state().presets[0].name).toBe("Exported Van");

    const before = state().presets;
    const library = JSON.parse(exported);
    for (const bad of [
      "not json",
      JSON.stringify([]),
      JSON.stringify({ version: 99, presets: [] }),
      JSON.stringify({ version: presetFileVersion }),
      JSON.stringify({ version: presetFileVersion, presets: [...library.presets, { ...library.presets[0], purchaseCost: -5 }] }),
      JSON.stringify({ version: presetFileVersion, presets: [library.presets[0], library.presets[0]] }),
    ]) {
      const result = state().importPresets(bad);
      expect(result.ok).toBe(false);
      expect(state().presets).toBe(before);
    }
  });
});
