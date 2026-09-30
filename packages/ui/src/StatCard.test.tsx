import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatCard } from "./components/StatCard";

describe("StatCard", () => {
  it("renders label, value, and caption in the kpi density by default", () => {
    render(<StatCard label="Total cost" value="$12,400" caption="over 5 years" />);

    expect(screen.getByText("Total cost")).toBeInTheDocument();
    expect(screen.getByText("$12,400")).toBeInTheDocument();
    expect(screen.getByText("over 5 years")).toBeInTheDocument();
  });

  it("omits the caption when not provided", () => {
    render(<StatCard label="Vehicles" value={5} />);

    expect(screen.getByText("Vehicles")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders the compact density layout", () => {
    render(<StatCard density="compact" label="Range" value="120 km" />);

    expect(screen.getByText("Range")).toBeInTheDocument();
    expect(screen.getByText("120 km")).toBeInTheDocument();
  });

  it("forwards native props and appends class names", () => {
    render(<StatCard data-testid="card" className="col-span-2" label="A" value="B" />);

    const card = screen.getByTestId("card");
    expect(card).toHaveClass("col-span-2");
  });
});
