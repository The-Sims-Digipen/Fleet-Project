import { describe, expect, it } from "vitest";
import type { M1ProjectDocument } from "./contracts";
import { sim01Fleet, sim01Project } from "./m1Fixture";
import { describePresetReference, findPresetReferences, findReferenceIssues, findVehiclePlanReferences, withoutVehiclePlan, type ScenarioPlans } from "./references";

const scenarios: ScenarioPlans[] = [
  { id: "plan-a", name: "Plan A", vehiclePlans: { "SIM01-VEHICLE": { transitionYear: 2027, targetPresetId: "sim01-electric" } } },
  { id: "plan-b", name: "Plan B", vehiclePlans: {} },
];

describe("preset references", () => {
  it("finds both fleet and scenario uses of a preset", () => {
    expect(findPresetReferences("sim01-diesel", sim01Fleet, scenarios)).toEqual([
      { kind: "fleet-current", vehicleId: "SIM01-VEHICLE", vehicleName: "SIM01 vehicle" },
    ]);
    expect(findPresetReferences("sim01-electric", sim01Fleet, scenarios)).toEqual([
      { kind: "scenario-target", scenarioId: "plan-a", scenarioName: "Plan A", vehicleId: "SIM01-VEHICLE" },
    ]);
    // An unused preset is free to delete.
    expect(findPresetReferences("unused", sim01Fleet, scenarios)).toEqual([]);
  });

  it("describes each reference so a blocked deletion can say what to fix", () => {
    const [fleetUse] = findPresetReferences("sim01-diesel", sim01Fleet, scenarios);
    const [scenarioUse] = findPresetReferences("sim01-electric", sim01Fleet, scenarios);
    expect(describePresetReference(fleetUse)).toContain("current preset");
    expect(describePresetReference(scenarioUse)).toContain("Plan A");
  });
});

describe("vehicle plan references", () => {
  it("lists only the scenarios that actually plan for the vehicle", () => {
    expect(findVehiclePlanReferences("SIM01-VEHICLE", scenarios)).toEqual([
      { scenarioId: "plan-a", scenarioName: "Plan A", plan: { transitionYear: 2027, targetPresetId: "sim01-electric" } },
    ]);
    expect(findVehiclePlanReferences("missing", scenarios)).toEqual([]);
  });

  it("removes one plan entry without mutating the original record", () => {
    const plans = { a: { transitionYear: 2027 }, b: { transitionYear: 2028 } };
    expect(withoutVehiclePlan(plans, "a")).toEqual({ b: { transitionYear: 2028 } });
    expect(plans.a).toBeDefined();
    expect(withoutVehiclePlan(plans, "missing")).toEqual(plans);
  });
});

describe("workspace reference invariants", () => {
  it("accepts a project whose references all resolve", () => {
    expect(findReferenceIssues(sim01Project, sim01Fleet, scenarios)).toEqual([]);
  });

  it("reports duplicate ids, dangling references and out-of-period years", () => {
    const duplicated: M1ProjectDocument = {
      ...sim01Project,
      vehiclePresets: [...sim01Project.vehiclePresets, sim01Project.vehiclePresets[0]],
    };
    const duplicatedFleet = [...sim01Fleet, { ...sim01Fleet[0], replacementYear: 2099 }];
    const issues = findReferenceIssues(duplicated, duplicatedFleet, [
      { id: "plan-c", name: "Plan C", vehiclePlans: { ghost: { transitionYear: 2027 } } },
      { id: "plan-d", name: "Plan D", vehiclePlans: { "SIM01-VEHICLE": { transitionYear: 2099, targetPresetId: "gone" } } },
    ]);
    expect(issues.some((issue) => issue.includes("Preset id"))).toBe(true);
    expect(issues.some((issue) => issue.includes("Vehicle id"))).toBe(true);
    expect(issues.some((issue) => issue.includes("replacement year outside"))).toBe(true);
    expect(issues.some((issue) => issue.includes("missing vehicle"))).toBe(true);
    expect(issues.some((issue) => issue.includes("missing preset"))).toBe(true);
    expect(issues.some((issue) => issue.includes("transition year outside"))).toBe(true);
  });

  it("reports a fleet vehicle whose current preset was removed", () => {
    const orphaned: M1ProjectDocument = { ...sim01Project, vehiclePresets: sim01Project.vehiclePresets.filter((preset) => preset.id !== "sim01-diesel") };
    expect(findReferenceIssues(orphaned, sim01Fleet, [])).toEqual([`SIM01-VEHICLE references missing preset "sim01-diesel".`]);
  });
});
