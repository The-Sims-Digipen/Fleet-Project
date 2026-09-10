import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createObject, getAsset } from "../scene/catalog";
import { modelResources, useModelResource } from "../scene/modelResources";
import { ModelStatus } from "./ModelStatus";

vi.mock("../scene/modelResources", () => ({ useModelResource: vi.fn(), modelResources: { retry: vi.fn() } }));
afterEach(cleanup);

describe("model status", () => {
  it("shows loading and offers retry for the affected asset", async () => {
    const object = createObject("bollard", "a")!;
    vi.mocked(useModelResource).mockReturnValue({ status: "loading", attempt: 0 });
    const view = render(<ModelStatus object={object} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading model");
    vi.mocked(useModelResource).mockReturnValue({ status: "error", attempt: 0, message: "404" });
    view.rerender(<ModelStatus object={object} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Model could not load");
    await userEvent.setup().click(screen.getByRole("button", { name: "Retry" }));
    expect(modelResources.retry).toHaveBeenCalledWith(getAsset("sample-bollard")!.url);
  });
  it("reports unknown definitions instead of throwing", () => {
    render(<ModelStatus object={{ ...createObject("bollard", "a")!, definitionId: "missing" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Unknown object definition");
  });
});
