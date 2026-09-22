import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge, type BadgeVariant } from "./components/Badge";

describe("Badge", () => {
  it("renders its content with the default variant", () => {
    render(<Badge>Default</Badge>);

    const badge = screen.getByText("Default");
    expect(badge).toHaveClass("bg-chargedup-grey");
  });

  it.each<[BadgeVariant, string]>([
    ["success", "text-status-success"],
    ["warning", "text-status-warning"],
    ["danger", "text-status-danger"],
    ["info", "text-chargedup-blue"],
  ])("applies the %s variant", (variant, expectedClass) => {
    render(<Badge variant={variant}>{variant}</Badge>);

    expect(screen.getByText(variant)).toHaveClass(expectedClass);
  });

  it("renders no dot by default", () => {
    render(<Badge variant="success">Active</Badge>);

    const badge = screen.getByText("Active");
    // The only decorative child would be the dot; there should be none.
    expect(within(badge).queryByText((_, node) => node?.getAttribute("aria-hidden") === "true")).toBeNull();
  });

  it("renders a decorative status dot when dot is set", () => {
    render(
      <Badge variant="success" dot>
        Active
      </Badge>,
    );

    const badge = screen.getByText("Active");
    const dot = within(badge).getByText((_, node) => node?.getAttribute("aria-hidden") === "true");
    expect(dot).toHaveClass("bg-current", "rounded-full");
  });

  it("appends a consumer class name and forwards native props", () => {
    render(
      <Badge className="uppercase" data-testid="pill">
        Tag
      </Badge>,
    );

    expect(screen.getByTestId("pill")).toHaveClass("uppercase");
  });
});
