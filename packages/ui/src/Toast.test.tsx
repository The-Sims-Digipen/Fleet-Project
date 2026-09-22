import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Toast, ToastViewport } from "./components/Toast";

describe("Toast", () => {
  it("uses the status role for non-danger tones", () => {
    render(<Toast tone="success">Saved</Toast>);

    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("uses the alert role for the danger tone", () => {
    render(<Toast tone="danger">Import failed</Toast>);

    expect(screen.getByRole("alert")).toHaveTextContent("Import failed");
  });

  it("renders no dismiss button when onDismiss is omitted", () => {
    render(<Toast tone="info">Heads up</Toast>);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onDismiss when the dismiss button is clicked", async () => {
    const onDismiss = vi.fn();
    render(
      <Toast tone="info" onDismiss={onDismiss} dismissLabel="Close notice">
        Heads up
      </Toast>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Close notice" }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("renders viewport children", () => {
    render(
      <ToastViewport placement="top-right">
        <Toast tone="info">Inside viewport</Toast>
      </ToastViewport>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Inside viewport");
  });
});
