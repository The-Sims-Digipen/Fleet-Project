import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TextField } from "./components/TextField";
import type { EditLifecycle } from "./components/editLifecycle";

function Controlled({ edit, initial = "Van" }: { edit?: EditLifecycle; initial?: string }) {
  const [value, setValue] = useState(initial);
  return <TextField label="Preset name" value={value} onChange={setValue} edit={edit} />;
}

describe("TextField", () => {
  it("associates the label with the input", () => {
    render(<Controlled />);
    expect(screen.getByLabelText("Preset name")).toHaveValue("Van");
  });

  it("commits typed text and fires the edit lifecycle", async () => {
    const edit = { beginEdit: vi.fn(), commitEdit: vi.fn(), cancelEdit: vi.fn() };
    render(<Controlled edit={edit} />);

    const input = screen.getByLabelText("Preset name");
    await userEvent.click(input);
    await userEvent.type(input, " A");
    expect(edit.beginEdit).toHaveBeenCalled();

    await userEvent.tab();
    expect(edit.commitEdit).toHaveBeenCalled();
    expect(input).toHaveValue("Van A");
  });

  it("runs the cancel hook on Escape", async () => {
    // This field commits valid input live and delegates rollback to the edit
    // lifecycle (e.g. undo/history), so Escape fires cancelEdit rather than
    // restoring text itself.
    const edit = { beginEdit: vi.fn(), commitEdit: vi.fn(), cancelEdit: vi.fn() };
    render(<Controlled edit={edit} />);

    const input = screen.getByLabelText("Preset name");
    await userEvent.click(input);
    await userEvent.type(input, "{Escape}");
    expect(edit.cancelEdit).toHaveBeenCalledOnce();
  });

  it("does not call onChange for empty input", async () => {
    const onChange = vi.fn();
    render(<TextField label="Name" value="X" onChange={onChange} />);

    const input = screen.getByLabelText("Name");
    await userEvent.click(input);
    await userEvent.clear(input);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("works without an edit prop", async () => {
    render(<Controlled />);
    const input = screen.getByLabelText("Preset name");
    await userEvent.click(input);
    await userEvent.type(input, "!");
    await userEvent.tab();
    expect(input).toHaveValue("Van!");
  });

  it("shows an error message with the alert role", () => {
    render(<TextField label="Name" value="X" onChange={() => {}} error="Required." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required.");
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
  });
});
