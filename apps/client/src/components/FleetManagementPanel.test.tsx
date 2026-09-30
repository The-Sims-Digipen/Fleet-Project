import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

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

afterEach(cleanup);

describe("fleet vehicle selection", () => {
  it("shows one selected vehicle's settings below the fleet list", async () => {
    const user = userEvent.setup();
    render(<FleetManagementPanel onVisualize={() => undefined} previewOpen={false} onClosePreview={() => undefined} />);

    expect(screen.getAllByRole("button", { name: /^Select / })).toHaveLength(6);
    expect(screen.getByRole("textbox", { name: "Vehicle name" })).toHaveValue("City Delivery Van");
    expect(screen.getAllByRole("combobox", { name: /preset/ })).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Select Regional Hauler" }));

    expect(screen.getByRole("textbox", { name: "Vehicle name" })).toHaveValue("Regional Hauler");
    expect(screen.getByRole("button", { name: "Select Regional Hauler" })).toHaveAttribute("aria-pressed", "true");
  });

  it("edits the selected vehicle's distance", async () => {
    const user = userEvent.setup();
    render(<FleetManagementPanel onVisualize={() => undefined} previewOpen={false} onClosePreview={() => undefined} />);

    const distance = screen.getByRole("spinbutton", { name: "Annual distance (km)" });
    expect(distance).toHaveValue(0);
    await user.click(distance);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("123");

    expect(distance).toHaveValue(123);
    expect(useFleetStore.getState().vehicles[0].annualKm).toBe(123);
  });
});
