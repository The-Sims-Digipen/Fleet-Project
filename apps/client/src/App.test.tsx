import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./components/WorldScene", () => ({
  WorldScene: ({ size }: { size: number }) => <div>Plane size {size}</div>,
}));

describe("starter playground", () => {
  it("updates example controls and resets their values", async () => {
    render(<App />);

    await screen.findByText("Plane size 8");
    fireEvent.change(screen.getByLabelText("Plane size"), { target: { value: "12" } });
    expect(screen.getByText("Plane size 12")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Apply settings" }));
    expect(screen.getByText("Settings applied")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("Plane size 8")).toBeInTheDocument();
    expect(screen.getByText("Controls reset")).toBeInTheDocument();
  });
});
