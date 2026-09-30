import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { PowerFeasibility } from "./PowerFeasibility";

afterEach(cleanup);

describe("Deferred charging and feasibility panel", () => {
  it("explains that charging inputs and feasibility results are later scope", async () => {
    const user = userEvent.setup();
    render(<PowerFeasibility />);
    await user.click(screen.getByRole("button", { name: "Charging & feasibility" }));

    expect(screen.getByText(/planned for a later milestone/i)).toBeInTheDocument();
    expect(screen.getByText(/not assumptions in this Project or its M1 simulation/i)).toBeInTheDocument();
    expect(screen.queryByText("Power Limit Exceeded")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Preview feasibility state" })).not.toBeInTheDocument();
  });
});
