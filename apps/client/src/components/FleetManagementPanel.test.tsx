import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockAnalysis, createMockFleet, createMockPresets } from "../domain/mockProject";
import { useFleetStore } from "../state/fleetStore";
import { usePresetStore } from "../state/presetStore";
import { createProjectFields, useProjectStore } from "../state/projectStore";
import { createDocument } from "../state/sceneStore";
import { FleetManagementPanel } from "./FleetManagementPanel";

beforeEach(() => {
  const document = createDocument();
  const inputs = { presets: createMockPresets(), fleet: createMockFleet(), analysis: createMockAnalysis() };
  inputs.fleet[0].annualKm = 0;
  usePresetStore.getState().replacePresets(inputs.presets);
  useFleetStore.getState().updateAnalysis(inputs.analysis);
  useFleetStore.getState().replaceFleet(inputs.fleet);
  useProjectStore.setState(createProjectFields("Fleet panel test", document, 0, inputs));
});

describe("fleet vehicle distance editing", () => {
  it("replaces an initial zero with the first typed distance", async () => {
    const user = userEvent.setup();
    const select = vi.spyOn(HTMLInputElement.prototype, "select");
    render(<FleetManagementPanel onVisualize={() => undefined} previewOpen={false} onClosePreview={() => undefined} />);

    const distance = screen.getByRole("spinbutton", { name: "Annual distance for UNIT-01" });
    expect(distance).toHaveValue(0);
    await user.click(distance);
    expect(select).toHaveBeenCalledOnce();
    await user.keyboard("123");

    expect(distance).toHaveValue(123);
    expect(useFleetStore.getState().vehicles[0].annualKm).toBe(123);
  });
});
