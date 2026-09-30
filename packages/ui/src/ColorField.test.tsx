import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ColorField } from "./components/ColorField";

function Controlled({ onCommit, initial = "#55d6be" }: { onCommit?: (v: string) => void; initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <ColorField
      label="Accent"
      value={value}
      onChange={(v) => {
        setValue(v);
        onCommit?.(v);
      }}
    />
  );
}

describe("ColorField", () => {
  it("exposes the swatch and the hex input with accessible names", () => {
    render(<Controlled />);
    expect(screen.getByLabelText("Accent")).toBeInTheDocument();
    expect(screen.getByLabelText("Accent hex value")).toHaveValue("#55D6BE");
  });

  it("commits immediately when the swatch changes", () => {
    const onCommit = vi.fn();
    render(<Controlled onCommit={onCommit} />);

    fireEvent.input(screen.getByLabelText("Accent"), { target: { value: "#ff0000" } });
    expect(onCommit).toHaveBeenLastCalledWith("#ff0000");
  });

  it("commits a valid hex string from the text input", async () => {
    const onCommit = vi.fn();
    render(<Controlled onCommit={onCommit} />);

    const hex = screen.getByLabelText("Accent hex value");
    await userEvent.clear(hex);
    await userEvent.type(hex, "#00ff00");
    expect(onCommit).toHaveBeenLastCalledWith("#00ff00");
  });

  it("does not commit an invalid hex string", async () => {
    const onCommit = vi.fn();
    render(<Controlled onCommit={onCommit} />);

    const hex = screen.getByLabelText("Accent hex value");
    await userEvent.clear(hex);
    await userEvent.type(hex, "#zzz");
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("cancels on Escape via the lifecycle", async () => {
    const edit = { beginEdit: vi.fn(), commitEdit: vi.fn(), cancelEdit: vi.fn() };
    function Wrapper() {
      const [value, setValue] = useState("#112233");
      return <ColorField label="Accent" value={value} edit={edit} onChange={setValue} />;
    }
    render(<Wrapper />);

    const hex = screen.getByLabelText("Accent hex value");
    await userEvent.click(hex);
    await userEvent.type(hex, "{Escape}");
    expect(edit.cancelEdit).toHaveBeenCalled();
  });
});
