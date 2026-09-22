import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBanner } from "./components/StatusBanner";

describe("StatusBanner", () => {
  it("renders the message with the status role for non-danger tones", () => {
    render(<StatusBanner tone="ok">Within budget</StatusBanner>);

    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent("Within budget");
  });

  it("uses the alert role for the danger tone", () => {
    render(<StatusBanner tone="danger">Peak power exceeded</StatusBanner>);

    expect(screen.getByRole("alert")).toHaveTextContent("Peak power exceeded");
  });

  it("renders a bold title before the message", () => {
    render(
      <StatusBanner tone="warning" title="Heads up">
        Approaching the limit
      </StatusBanner>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Heads up Approaching the limit");
  });

  it("appends consumer class names", () => {
    render(
      <StatusBanner tone="info" className="mt-4">
        Info
      </StatusBanner>,
    );

    expect(screen.getByRole("status")).toHaveClass("mt-4");
  });
});
