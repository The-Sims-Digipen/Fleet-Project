import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Fieldset } from "./components/Fieldset";
import { Input } from "./components/Input";

describe("Fieldset", () => {
  it("exposes the title as the group's accessible name via the legend", () => {
    render(
      <Fieldset title="Identity">
        <Input label="Name" />
      </Fieldset>,
    );

    expect(screen.getByRole("group", { name: "Identity" })).toBeInTheDocument();
  });

  it("renders the optional description", () => {
    render(
      <Fieldset title="Energy" description="Values used by the simulation.">
        <Input label="Battery" />
      </Fieldset>,
    );

    expect(screen.getByText("Values used by the simulation.")).toBeInTheDocument();
  });

  it("renders its children", () => {
    render(
      <Fieldset title="Section">
        <Input label="Field A" />
        <Input label="Field B" />
      </Fieldset>,
    );

    expect(screen.getByLabelText("Field A")).toBeInTheDocument();
    expect(screen.getByLabelText("Field B")).toBeInTheDocument();
  });

  it("appends consumer class names and forwards native props", () => {
    render(
      <Fieldset title="Section" className="col-span-2" data-testid="fs">
        <Input label="X" />
      </Fieldset>,
    );

    const fs = screen.getByTestId("fs");
    expect(fs).toHaveClass("col-span-2");
  });
});
