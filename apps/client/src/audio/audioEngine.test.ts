import { describe, expect, it, vi } from "vitest";
import { audioTestConfig as config, createAudioHarness } from "../test/audioHarness";

describe("audio playback", () => {
  it("plays a demo sound selected from fetched runtime configuration", async () => {
    const { engine, fetcher } = createAudioHarness();
    await engine.load();
    await engine.play("effect-0");
    expect(engine.getSnapshot().active["effect-0"]).toBe(1);
    expect(fetcher).toHaveBeenCalledWith("http://localhost/audio/effect-0.wav", expect.anything());
    engine.dispose();
  });

  it("keeps one BGM and eight SFX playing when another SFX or BGM is requested", async () => {
    const { engine, sources } = createAudioHarness();
    await engine.load();
    await engine.play("music");
    await Promise.all(Array.from({ length: 8 }, (_, i) => engine.play(`effect-${i}`)));
    await engine.play("effect-0");
    await engine.play("music");
    expect(engine.getSnapshot().active).toEqual({ music: 1, "effect-0": 2, "effect-1": 1, "effect-2": 1, "effect-3": 1, "effect-4": 1, "effect-5": 1, "effect-6": 1, "effect-7": 1 });
    expect(sources).toHaveLength(10);
    expect(sources.every((source) => source.stop.mock.calls.length === 0)).toBe(true);
    engine.dispose();
  });

  it("updates loops on active voices and stops only the chosen demo track", async () => {
    const { engine, sources } = createAudioHarness();
    await engine.load();
    engine.setLoop("effect-0", true);
    await engine.play("effect-0");
    await engine.play("effect-0");
    await engine.play("music");
    expect(sources.slice(0, 2).every((source) => source.loop)).toBe(true);
    engine.setLoop("effect-0", false);
    expect(sources.slice(0, 2).every((source) => !source.loop)).toBe(true);
    engine.stop("effect-0");
    expect(engine.getSnapshot().active).toEqual({ music: 1 });
    expect(sources[2].stop).not.toHaveBeenCalled();
    engine.stopAll();
    expect(engine.getSnapshot().active).toEqual({});
    engine.dispose();
  });

  it("cancels pending starts when stopped and disposes playback after decoding", async () => {
    const { engine, context, sources } = createAudioHarness();
    await engine.load();
    let finishDecode!: (value: { duration: number }) => void;
    context.decodeAudioData.mockImplementationOnce(() => new Promise((resolve) => { finishDecode = resolve; }));
    const pending = engine.play("effect-0");
    await vi.waitFor(() => expect(context.decodeAudioData).toHaveBeenCalled());
    engine.stopAll();
    finishDecode({ duration: 1 });
    await pending;
    expect(engine.getSnapshot().active).toEqual({});
    expect(sources).toHaveLength(0);
    await engine.play("effect-0");
    engine.dispose();
    expect(engine.getSnapshot().active).toEqual({});
    expect(context.close).toHaveBeenCalledOnce();
  });

  it("uses the configured button binding for nested/modal targets without stopping feedback with the demo", async () => {
    const customConfig = { ...config, buttonClick: { selector: "button.audible", sound: "click" } };
    const { engine, sources } = createAudioHarness(customConfig);
    await engine.load();
    const dialog = document.createElement("dialog");
    dialog.innerHTML = '<button class="audible"><span>Play</span></button><button>Silent</button><button class="audible" disabled>Disabled</button>';
    document.body.append(dialog);
    await engine.handleButtonClick(dialog.querySelector("span"));
    await engine.handleButtonClick(dialog.querySelectorAll("button")[1]);
    await engine.handleButtonClick(dialog.querySelectorAll("button")[2]);
    expect(engine.getSnapshot().feedback).toBe(1);
    expect(sources[0].loop).toBe(false);
    engine.stopAll();
    expect(engine.getSnapshot().feedback).toBe(1);
    engine.dispose();
    dialog.remove();
  });

  it("stops a requested demo sound even before its configuration arrives", async () => {
    const { engine, fetcher } = createAudioHarness();
    let finishConfig!: (value: Response) => void;
    fetcher.mockImplementationOnce(() => new Promise((resolve) => { finishConfig = resolve; }));
    const pending = engine.play("effect-0");
    engine.stopAll();
    finishConfig(new Response(JSON.stringify(config)));
    await pending;
    expect(engine.getSnapshot().active).toEqual({});
    engine.dispose();
  });

  it("reports decoding failures and allows a successful retry", async () => {
    const { engine, context } = createAudioHarness();
    await engine.load();
    context.decodeAudioData.mockRejectedValueOnce(new Error("Invalid WAV"));
    await engine.play("effect-0");
    expect(engine.getSnapshot().error).toContain("Invalid WAV");
    expect(engine.getSnapshot().active).toEqual({});
    await engine.play("effect-0");
    expect(engine.getSnapshot().active["effect-0"]).toBe(1);
    expect(engine.getSnapshot().error).toBeNull();
    engine.dispose();
  });

  it.each([
    { ...config, version: 2 },
    { ...config, sounds: [...config.sounds, config.sounds[0]] },
    { ...config, buttonClick: { selector: "[", sound: "click" } },
    { ...config, buttonClick: { selector: "button", sound: "missing" } },
    { ...config, demo: ["missing"] },
    { ...config, sounds: [{ ...config.sounds[0], gain: -1 }] },
  ])("reports invalid runtime data without exposing an unusable catalogue (%#)", async (manifest) => {
    const { engine } = createAudioHarness(manifest);
    await engine.load();
    expect(engine.getSnapshot().status).toBe("error");
    expect(engine.getSnapshot().config).toBeNull();
    engine.dispose();
  });

  it("releases completed voices and disposes only once", async () => {
    const { engine, context, sources } = createAudioHarness();
    await engine.load();
    await engine.play("effect-0");
    await engine.play("effect-1");
    sources[0].onended?.();
    expect(engine.getSnapshot().active).toEqual({ "effect-1": 1 });
    engine.dispose();
    engine.dispose();
    expect(engine.getSnapshot().active).toEqual({});
    expect(context.close).toHaveBeenCalledOnce();
  });

  it("treats catalogue IDs as data even when they match JavaScript property names", async () => {
    const manifest = {
      ...config,
      sounds: config.sounds.map((sound) => sound.id === "effect-0" ? { ...sound, id: "constructor" } : sound),
      demo: config.demo.map((id) => id === "effect-0" ? "constructor" : id),
    };
    const { engine, sources } = createAudioHarness(manifest);
    await engine.load();
    await engine.play("constructor");
    expect(engine.getSnapshot().active["constructor"]).toBe(1);
    expect(sources[0].loop).toBe(false);
    engine.dispose();
  });
});
