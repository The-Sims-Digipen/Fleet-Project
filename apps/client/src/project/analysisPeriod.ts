import { analysisEndYear } from "../domain/contracts";
import { defaultAnalysisSettings } from "../domain/mockProject";

/**
 * The analysis period a project starts from.
 *
 * The authoritative period is project-owned and lives in the fleet store, so
 * new code should read `useFleetStore().analysis`. These constants remain the
 * default bounds for T04, which owns clamping the selected year when the period
 * changes.
 */
export const START_YEAR = defaultAnalysisSettings.startYear;
export const END_YEAR = analysisEndYear(defaultAnalysisSettings);
