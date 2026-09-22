import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProgressBar } from "./components/ProgressBar";

describe("ProgressBar", () => {
  it("exposes progressbar role with aria-value attributes", () => {
    render(<ProgressBar value={30} max={120} />);

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "30");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "120");
  });

  it("clamps values above the max", () => {
    render(<ProgressBar value={200} max={100} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("clamps negative values to zero", () => {
    render(<ProgressBar value={-5} max={100} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("renders label and value readout when provided", () => {
    render(<ProgressBar value={50} max={100} label="Diesel" valueLabel="$5,000" />);

    expect(screen.getByText("Diesel")).toBeInTheDocument();
    expect(screen.getByText("$5,000")).toBeInTheDocument();
  });
});
