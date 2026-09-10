import { Group } from "three";
import { describe, expect, it, vi } from "vitest";
import { createModelResources } from "./modelResources";

describe("model resource cache", () => {
  it("shares one request and scene across subscribers", async () => {
    const scene = new Group();
    const load = vi.fn(async () => scene);
    const resources = createModelResources(load);
    const listener = vi.fn();
    const unsubscribe = resources.subscribe("sample.glb", listener);
    resources.subscribe("sample.glb", vi.fn());
    await vi.waitFor(() => expect(resources.getSnapshot("sample.glb").status).toBe("ready"));
    expect(load).toHaveBeenCalledOnce();
    expect(resources.getSnapshot("sample.glb")).toMatchObject({ scene });
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });
  it("isolates a failed asset, retries it, and notifies existing instances", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("404")).mockResolvedValue(new Group());
    const resources = createModelResources(load);
    const changed = vi.fn();
    resources.subscribe("broken.glb", changed);
    await vi.waitFor(() => expect(resources.getSnapshot("broken.glb").status).toBe("error"));
    resources.subscribe("healthy.glb", vi.fn());
    await vi.waitFor(() => expect(resources.getSnapshot("healthy.glb").status).toBe("ready"));
    resources.retry("broken.glb");
    expect(resources.getSnapshot("broken.glb")).toEqual({ status: "loading", attempt: 1 });
    resources.retry("broken.glb");
    await vi.waitFor(() => expect(resources.getSnapshot("broken.glb").status).toBe("ready"));
    expect(load).toHaveBeenCalledTimes(3);
    expect(changed).toHaveBeenCalledTimes(3);
    expect(resources.getSnapshot("healthy.glb").status).toBe("ready");
  });
});
