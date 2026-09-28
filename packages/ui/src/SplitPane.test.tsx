import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SplitPane } from "./components/SplitPane";

function panes(): [ReactNode, ReactNode] {
  return [<div key="a">Primary</div>, <div key="b">Secondary</div>];
}

describe("SplitPane", () => {
  it("renders both panes and an accessible separator", () => {
    render(<SplitPane label="Resize sidebar">{panes()}</SplitPane>);

    expect(screen.getByText("Primary")).toBeInTheDocument();
    expect(screen.getByText("Secondary")).toBeInTheDocument();
    expect(screen.getByRole("separator", { name: "Resize sidebar" })).toBeInTheDocument();
  });

  it("exposes aria-value attributes reflecting the current size", () => {
    render(
      <SplitPane defaultSize={40} min={15} max={85}>
        {panes()}
      </SplitPane>,
    );

    const sep = screen.getByRole("separator");
    expect(sep).toHaveAttribute("aria-valuenow", "40");
    expect(sep).toHaveAttribute("aria-valuemin", "15");
    expect(sep).toHaveAttribute("aria-valuemax", "85");
    expect(sep).toHaveAttribute("aria-orientation", "vertical");
  });

  it("grows the second pane with ArrowLeft in horizontal orientation", async () => {
    const onSizeChange = vi.fn();
    render(
      <SplitPane defaultSize={40} step={5} onSizeChange={onSizeChange}>
        {panes()}
      </SplitPane>,
    );

    const sep = screen.getByRole("separator");
    sep.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onSizeChange).toHaveBeenLastCalledWith(45);
  });

  it("clamps to min and max via Home and End", async () => {
    const onSizeChange = vi.fn();
    render(
      <SplitPane defaultSize={40} min={20} max={80} onSizeChange={onSizeChange}>
        {panes()}
      </SplitPane>,
    );

    const sep = screen.getByRole("separator");
    sep.focus();
    await userEvent.keyboard("{Home}");
    expect(onSizeChange).toHaveBeenLastCalledWith(20);
    await userEvent.keyboard("{End}");
    expect(onSizeChange).toHaveBeenLastCalledWith(80);
  });

  it("uses horizontal aria-orientation when vertical", () => {
    render(
      <SplitPane orientation="vertical">{panes()}</SplitPane>,
    );

    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");
  });
});
