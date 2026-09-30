import { createRef } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  ListPanel,
  ListPanelToolbar,
  ListPanelBody,
  ListPanelItems,
  ListPanelItem,
  ListPanelFooter,
} from "./components/ListPanel";

describe("ListPanel", () => {
  it("renders toolbar title, trailing content, and footer status", () => {
    render(
      <ListPanel>
        <ListPanelToolbar title="Worlds" trailing={<span>3</span>}>
          <button type="button">New</button>
        </ListPanelToolbar>
        <ListPanelBody>
          <ListPanelItems label="Worlds">
            <ListPanelItem>Alpha</ListPanelItem>
          </ListPanelItems>
        </ListPanelBody>
        <ListPanelFooter status="3 worlds">
          <button type="button">Export</button>
        </ListPanelFooter>
      </ListPanel>,
    );

    expect(screen.getByText("Worlds")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("3 worlds")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("exposes the list with an accessible name", () => {
    render(
      <ListPanelItems label="Vehicle presets">
        <ListPanelItem>Diesel Delivery Van</ListPanelItem>
      </ListPanelItems>,
    );

    expect(screen.getByRole("list", { name: "Vehicle presets" })).toBeInTheDocument();
  });

  it("renders the empty state instead of children when empty", () => {
    render(
      <ListPanelBody empty emptyMessage="No presets yet.">
        <ListPanelItems label="Presets">
          <ListPanelItem>Hidden</ListPanelItem>
        </ListPanelItems>
      </ListPanelBody>,
    );

    expect(screen.getByText("No presets yet.")).toBeInTheDocument();
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("reflects selection through aria-pressed", () => {
    render(
      <ListPanelItems label="Items">
        <ListPanelItem selected>Selected row</ListPanelItem>
        <ListPanelItem>Other row</ListPanelItem>
      </ListPanelItems>,
    );

    expect(screen.getByRole("button", { name: "Selected row" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Other row" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onSelect when a row is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <ListPanelItems label="Items">
        <ListPanelItem onSelect={onSelect}>Clickable</ListPanelItem>
      </ListPanelItems>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Clickable" }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("marks leading and trailing slots as decorative and keeps the label as the accessible name", () => {
    render(
      <ListPanelItems label="Items">
        <ListPanelItem leading={<span>◇</span>} trailing={<span>Van</span>}>
          Diesel Delivery Van
        </ListPanelItem>
      </ListPanelItems>,
    );

    // Decorative slots must not leak into the button's accessible name.
    const button = screen.getByRole("button", { name: "Diesel Delivery Van" });
    const decorative = within(button).getAllByText((_, node) => node?.getAttribute("aria-hidden") === "true");
    expect(decorative.length).toBeGreaterThanOrEqual(2);
  });

  it("does not fire onSelect when disabled", async () => {
    const onSelect = vi.fn();
    render(
      <ListPanelItems label="Items">
        <ListPanelItem disabled onSelect={onSelect}>
          Disabled row
        </ListPanelItem>
      </ListPanelItems>,
    );

    const button = screen.getByRole("button", { name: "Disabled row" });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("forwards the item DOM ref and appends consumer class names", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <ListPanelItems label="Items">
        <ListPanelItem ref={ref} className="custom-row">
          Referenced
        </ListPanelItem>
      </ListPanelItems>,
    );

    const button = screen.getByRole("button", { name: "Referenced" });
    expect(ref.current).toBe(button);
    expect(button).toHaveClass("custom-row");
  });

  it("forwards native props on the container", () => {
    render(
      <ListPanel data-testid="panel" aria-label="Presets panel">
        <ListPanelBody>content</ListPanelBody>
      </ListPanel>,
    );

    expect(screen.getByTestId("panel")).toHaveAttribute("aria-label", "Presets panel");
  });
});
