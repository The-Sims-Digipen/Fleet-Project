import seedFile from "./defaults.json";
import { normalizePreset, type VehiclePreset } from "./types";

/**
 * Seed presets live in `defaults.json` so they stay hand-editable data rather
 * than code, and so the dev-server write-back can rewrite them from the running
 * UI. The file uses the same shape as an Export download, so an exported
 * library can be dropped in as the seed unchanged.
 *
 * Values are indicative synthetic planning figures, not manufacturer
 * specifications or suggested user defaults.
 *
 * This function is the single seam between preset data and its source: F09
 * replaces its body with an API call and nothing else in the feature changes.
 */
export function loadDefaultPresets(): VehiclePreset[] {
  const presets: VehiclePreset[] = [];
  for (const [index, record] of seedFile.presets.entries()) {
    // normalizePreset returns a fresh object, so callers always get independent copies.
    const preset = normalizePreset(record);
    if (preset) presets.push(preset);
    // A hand-edited seed file should not white-screen the app; skip and report.
    else console.error(`Seed preset ${index + 1} in vehicles/defaults.json is invalid and was skipped.`);
  }
  return presets;
}
