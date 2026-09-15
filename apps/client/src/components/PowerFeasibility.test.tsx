import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { PowerFeasibility, evaluateFeasibility } from "./PowerFeasibility";

afterEach(cleanup);

describe("evaluateFeasibility", () => {
  it.each([
    { siteLimitKw: 250, peakDemandKw: 180, availableKw: 70, exceeded: false },
    { siteLimitKw: 250, peakDemandKw: 320, availableKw: -70, exceeded: true },
    { siteLimitKw: 250, peakDemandKw: 250, availableKw: 0, exceeded: false }, // boundary: equal is not exceeded
    { siteLimitKw: 400, peakDemandKw: 401, availableKw: -1, exceeded: true }, // boundary: one over
  ])("limit $siteLimitKw, demand $peakDemandKw", ({ siteLimitKw, peakDemandKw, availableKw, exceeded }) => {
    expect(evaluateFeasibility({ siteLimitKw, peakDemandKw })).toEqual({ availableKw, exceeded });
  });
});

// Rendering layer: feed values via the `data` prop and assert the panel shows
// them and picks the right status. This survives the switch to real data.
describe("Power and Feasibility panel", () => {
  async function openPanelWith(data?: { siteLimitKw: number; peakDemandKw: number }) {
    const user = userEvent.setup();
    render(<PowerFeasibility data={data} />);
    await user.click(screen.getByRole("button", { name: "Power & Feasibility" }));
    return user;
  }

  it("renders the three provided values with units and derived headroom", async () => {
    await openPanelWith({ siteLimitKw: 300, peakDemandKw: 120 });
    expect(screen.getByText("Site connection limit").parentElement).toHaveTextContent("300 kW");
    expect(screen.getByText("Estimated peak demand").parentElement).toHaveTextContent("120 kW");
    expect(screen.getByText("Available capacity").parentElement).toHaveTextContent("180 kW");
  });

  it("presents Within Capacity as a non-alert status, not color alone", async () => {
    await openPanelWith({ siteLimitKw: 300, peakDemandKw: 120 });
    expect(screen.getByRole("status")).toHaveTextContent("Within Capacity");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("presents an obvious Power Limit Exceeded alert with negative headroom", async () => {
    await openPanelWith({ siteLimitKw: 400, peakDemandKw: 500 });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Power Limit Exceeded");
    expect(within(alert).getByText("▲")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Available capacity").parentElement).toHaveTextContent("-100 kW");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("hides the demo toggle when real data is supplied", async () => {
    await openPanelWith({ siteLimitKw: 300, peakDemandKw: 120 });
    expect(screen.queryByRole("group", { name: "Preview feasibility state" })).not.toBeInTheDocument();
  });
});

// Demo mock layer: with no data prop, the toggle drives the mock scenarios.
// These tests (and the toggle) are removed when real data is wired in.
describe("Power and Feasibility demo toggle", () => {
  async function openMockPanel() {
    const user = userEvent.setup();
    render(<PowerFeasibility />);
    await user.click(screen.getByRole("button", { name: "Power & Feasibility" }));
    return user;
  }

  it("defaults to the within-capacity mock scenario", async () => {
    await openMockPanel();
    expect(screen.getByRole("status")).toHaveTextContent("Within Capacity");
    expect(screen.getByRole("button", { name: "Within capacity" })).toHaveAttribute("aria-pressed", "true");
  });

  it("flips to the over-limit mock scenario", async () => {
    const user = await openMockPanel();
    await user.click(screen.getByRole("button", { name: "Over limit" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Power Limit Exceeded");
    expect(screen.getByRole("button", { name: "Over limit" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Within capacity" })).toHaveAttribute("aria-pressed", "false");
  });
});
