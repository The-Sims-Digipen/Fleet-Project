import { afterEach, describe, expect, it, vi } from "vitest";

import { createId } from "./createId";

afterEach(() => vi.unstubAllGlobals());

describe("Project entity IDs", () => {
  it("uses the browser UUID API when available", () => {
    const randomUUID = vi.fn(() => "e9c1cba6-3402-42d3-a2a7-f7e296fe8b11");
    vi.stubGlobal("crypto", { randomUUID });

    expect(createId()).toBe("e9c1cba6-3402-42d3-a2a7-f7e296fe8b11");
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  it("generates distinct UUID v4 IDs with the HTTP-compatible random API", () => {
    vi.stubGlobal("crypto", { getRandomValues: crypto.getRandomValues.bind(crypto) });
    const ids = Array.from({ length: 100 }, () => createId());

    expect(new Set(ids).size).toBe(100);
    for (const id of ids) {
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
  });
});
