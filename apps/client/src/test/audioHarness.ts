import { vi } from "vitest";
import { AudioEngine } from "../audio/audioEngine";

export const audioTestConfig = {
  version: 1,
  sounds: [
    { id: "click", label: "Click", src: "click.wav", channel: "sfx", gain: 0.5 },
    { id: "music", label: "Music", src: "music.wav", channel: "bgm", gain: 0.1 },
    ...Array.from({ length: 8 }, (_, i) => ({ id: `effect-${i}`, label: `Effect ${i}`, src: `effect-${i}.wav`, channel: "sfx", gain: 0.1 })),
  ],
  buttonClick: { selector: "button", sound: "click" },
  demo: ["music", ...Array.from({ length: 8 }, (_, i) => `effect-${i}`)],
};

// Browser APIs are the only fakes: all configuration, engine, and UI code is real.
export function createAudioHarness(manifest: unknown = audioTestConfig) {
  const sources: { loop: boolean; stop: ReturnType<typeof vi.fn>; onended: (() => void) | null }[] = [];
  const context = {
    state: "running",
    destination: {},
    resume: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    decodeAudioData: vi.fn(async () => ({ duration: 1 })),
    createGain: () => ({ gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() }),
    createBufferSource: () => {
      const source = { loop: false, buffer: null, start: vi.fn(), stop: vi.fn(), connect: vi.fn(), disconnect: vi.fn(), onended: null as (() => void) | null };
      sources.push(source);
      return source;
    },
  };
  const fetcher = vi.fn(async (url: RequestInfo | URL) => String(url).endsWith("config.json")
    ? new Response(JSON.stringify(manifest), { headers: { "Content-Type": "application/json" } })
    : new Response(new ArrayBuffer(4)));
  const engine = new AudioEngine("http://localhost/audio/config.json", {
    fetch: fetcher as typeof fetch,
    createContext: () => context as unknown as AudioContext,
  });
  return { engine, sources, context, fetcher };
}
