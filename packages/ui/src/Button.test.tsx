import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, type ButtonVariant } from "./components/Button";

describe("Button", () => {
  it("uses the primary variant and button type by default", () => {
    render(<Button>Continue</Button>);

    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("bg-chargedup-gold", "text-chargedup-night");
  });

  it.each<[ButtonVariant, string]>([
    ["primary", "bg-chargedup-gold"],
    ["secondary", "bg-chargedup-night"],
    ["ghost", "bg-transparent"],
    ["danger", "bg-status-danger"],
  ])("applies the %s variant", (variant, expectedClass) => {
    render(<Button variant={variant}>{variant}</Button>);

    expect(screen.getByRole("button", { name: variant })).toHaveClass(expectedClass);
  });

  it("forwards native props and allows the type to be overridden", () => {
    render(
      <Button aria-label="Save changes" data-testid="save" name="intent" type="submit">
        Save
      </Button>,
    );

    expect(screen.getByTestId("save")).toHaveAttribute("aria-label", "Save changes");
    expect(screen.getByTestId("save")).toHaveAttribute("name", "intent");
    expect(screen.getByTestId("save")).toHaveAttribute("type", "submit");
  });

  it("forwards its DOM ref", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Referenced</Button>);

    expect(ref.current).toBe(screen.getByRole("button", { name: "Referenced" }));
  });

  it("appends a consumer class name", () => {
    render(<Button className="w-full">Wide</Button>);

    expect(screen.getByRole("button", { name: "Wide" })).toHaveClass("w-full");
  });

  it("handles clicks", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Run</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Run" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("uses native disabled behavior to prevent clicks", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Run
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Run" });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
