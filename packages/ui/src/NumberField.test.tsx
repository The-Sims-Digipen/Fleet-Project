import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NumberField } from "./components/NumberField";

function Controlled({
  onCommit,
  min,
  max,
  initial = 10,
}: {
  onCommit?: (v: number) => void;
  min?: number;
  max?: number;
  initial?: number;
}) {
  const [value, setValue] = useState(initial);
  return (
    <NumberField
      label="Battery"
      value={value}
      min={min}
      max={max}
      onChange={(v) => {
        setValue(v);
        onCommit?.(v);
      }}
    />
  );
}

describe("NumberField", () => {
  it("renders the numeric value under an accessible label", () => {
    render(<Controlled initial={42} />);
    expect(screen.getByLabelText("Battery")).toHaveValue(42);
  });

  it("commits a valid number typed by the user", async () => {
    const onCommit = vi.fn();
    render(<Controlled onCommit={onCommit} min={0} />);

    const input = screen.getByLabelText("Battery");
    await userEvent.clear(input);
    await userEvent.type(input, "55");
    expect(onCommit).toHaveBeenLastCalledWith(55);
  });

  it("does not commit values below min", async () => {
    const onCommit = vi.fn();
    render(<Controlled onCommit={onCommit} min={10} initial={20} />);

    const input = screen.getByLabelText("Battery");
    await userEvent.clear(input);
    await userEvent.type(input, "5");
    expect(onCommit).not.toHaveBeenCalledWith(5);
  });

  it("does not commit values above max", async () => {
    const onCommit = vi.fn();
    render(<Controlled onCommit={onCommit} max={100} initial={50} />);

    const input = screen.getByLabelText("Battery");
    await userEvent.clear(input);
    await userEvent.type(input, "150");
    expect(onCommit).not.toHaveBeenCalledWith(150);
  });

  it("fires the edit lifecycle on focus, change, and commit", async () => {
    const edit = { beginEdit: vi.fn(), commitEdit: vi.fn(), cancelEdit: vi.fn() };
    function Wrapper() {
      const [value, setValue] = useState(3);
      return <NumberField label="Power" value={value} min={0} edit={edit} onChange={setValue} />;
    }
    render(<Wrapper />);

    const input = screen.getByLabelText("Power");
    await userEvent.click(input);
    expect(edit.beginEdit).toHaveBeenCalled();
    await userEvent.type(input, "9");
    await userEvent.tab();
    expect(edit.commitEdit).toHaveBeenCalled();
  });

  it("cancels on Escape", async () => {
    const edit = { beginEdit: vi.fn(), commitEdit: vi.fn(), cancelEdit: vi.fn() };
    function Wrapper() {
      const [value, setValue] = useState(3);
      return <NumberField label="Power" value={value} edit={edit} onChange={setValue} />;
    }
    render(<Wrapper />);

    const input = screen.getByLabelText("Power");
    await userEvent.click(input);
    await userEvent.type(input, "{Escape}");
    expect(edit.cancelEdit).toHaveBeenCalled();
  });
});
