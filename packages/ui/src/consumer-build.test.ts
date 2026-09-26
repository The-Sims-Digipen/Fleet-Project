import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { build, type Rollup } from "vite";
import { describe, expect, it } from "vitest";

const fixtureRoot = resolve(process.cwd(), "fixtures/consumer");

describe("consumer build", () => {
  it("generates component utilities from the separately imported theme", async () => {
    const result = await build({
      root: fixtureRoot,
      configFile: false,
      plugins: [react(), tailwindcss()],
      logLevel: "silent",
      build: {
        cssCodeSplit: false,
        write: false,
      },
    });

    const outputs = Array.isArray(result) ? result : [result];
    const cssAsset = outputs
      .flatMap((output) => ("output" in output ? output.output : []))
      .find(
        (entry): entry is Rollup.OutputAsset =>
          entry.type === "asset" && entry.fileName.endsWith(".css"),
      );
    const css = String(cssAsset?.source ?? "");

    expect(css).toContain(".bg-chargedup-gold");
    expect(css).toContain(".text-chargedup-night");
    expect(css).toContain(".min-h-11");
    expect(css).not.toContain(".max-w-6xl");
    expect(css).not.toContain(".w-full");
  });
});
