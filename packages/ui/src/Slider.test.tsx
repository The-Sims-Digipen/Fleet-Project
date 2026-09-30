import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Slider } from "./components/Slider";

describe("Slider", () => {
  it("renders a labelled range with a value readout", () => {
    render(<Slider label="Speed" value={40} min={0} max={100} unit="%" onChange={() => {}} />);

    const input = screen.getByRole("slider", { name: "Speed" });
    expect(input).toHaveValue("40");
    expect(screen.getByText("40%")).toBeInTheDocument();
  });

  it("calls onChange with the parsed numeric value", () => {
    const onChange = vi.fn();
    render(<Slider label="Speed" value={40} min={0} max={100} onChange={onChange} />);

    fireEvent.change(screen.getByRole("slider", { name: "Speed" }), { target: { value: "75" } });
    expect(onChange).toHaveBeenCalledWith(75);
  });

  it("hides the readout when hideValue is set", () => {
    render(<Slider label="Speed" value={40} min={0} max={100} hideValue onChange={() => {}} />);

    expect(screen.queryByText("40")).not.toBeInTheDocument();
  });

  it("associates the label with the input via htmlFor", () => {
    render(<Slider label="Charge" value={10} min={0} max={20} onChange={() => {}} />);

    // getByRole with an accessible name proves the label/input association.
    expect(screen.getByRole("slider", { name: "Charge" })).toBeInTheDocument();
  });
});
