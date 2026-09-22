import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SegmentedControl } from "./components/SegmentedControl";

const options = [
  { value: "translate", label: "Move" },
  { value: "rotate", label: "Rotate" },
  { value: "scale", label: "Scale", disabled: true },
] as const;

describe("SegmentedControl", () => {
  it("exposes the group label and reflects selection via aria-pressed", () => {
    render(
      <SegmentedControl label="Transform mode" value="rotate" options={[...options]} onChange={() => {}} />,
    );

    expect(screen.getByRole("group", { name: "Transform mode" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rotate" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Move" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with the selected value", async () => {
    const onChange = vi.fn();
    render(<SegmentedControl value="translate" options={[...options]} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Rotate" }));
    expect(onChange).toHaveBeenCalledWith("rotate");
  });

  it("does not fire onChange for a disabled option", async () => {
    const onChange = vi.fn();
    render(<SegmentedControl value="translate" options={[...options]} onChange={onChange} />);

    const scale = screen.getByRole("button", { name: "Scale" });
    expect(scale).toBeDisabled();
    await userEvent.click(scale);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("uses ariaLabel as the accessible name when the label is decorative", () => {
    render(
      <SegmentedControl
        value="a"
        options={[
          { value: "a", label: "◆", ariaLabel: "Diamond" },
          { value: "b", label: "●", ariaLabel: "Circle" },
        ]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Diamond" })).toBeInTheDocument();
  });
});
