import { parseAudioConfig, type AudioConfig } from "./audioConfig";

export type AudioSnapshot = {
  status: "loading" | "ready" | "error";
  config: AudioConfig | null;
  error: string | null;
  active: Record<string, number>;
  loops: Record<string, boolean>;
  pending: Record<string, number>;
  feedback: number;
};

type Scope = "demo" | "feedback";
type Voice = { soundId: string; channel: "bgm" | "sfx"; scope: Scope; source: AudioBufferSourceNode; gain: GainNode };
type AudioDependencies = { fetch: typeof fetch; createContext: () => AudioContext };

export class AudioEngine {
  private configUrl: string;
  private dependencies: AudioDependencies;
  private context: AudioContext | null = null;
  private ready: Promise<void> | null = null;
  private abort = new AbortController();
  private disposed = false;
  private listeners = new Set<() => void>();
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private voices = new Set<Voice>();
  private starts = new Map<symbol, { soundId: string | null; scope: Scope }>();
  private bgmStart: symbol | null = null;
  private snapshot: AudioSnapshot = { status: "loading", config: null, error: null, active: Object.create(null), loops: Object.create(null), pending: Object.create(null), feedback: 0 };

  constructor(configUrl: string, dependencies?: AudioDependencies) {
    this.configUrl = new URL(configUrl, window.location.href).href;
    this.dependencies = dependencies ?? { fetch: (...args) => fetch(...args), createContext: () => new AudioContext() };
  }

  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private publish(update: Partial<AudioSnapshot>) {
    this.snapshot = { ...this.snapshot, ...update };
    this.listeners.forEach((listener) => listener());
  }

  load(): Promise<void> {
    this.ready ??= (async () => {
      try {
        const response = await this.dependencies.fetch(this.configUrl, { cache: "no-store", signal: this.abort.signal });
        if (!response.ok) throw new Error(`Audio configuration could not load (${response.status}).`);
        const config = parseAudioConfig(await response.json());
        if (!this.disposed) this.publish({ status: "ready", config });
      } catch (error) {
        if (!this.disposed) this.publish({ status: "error", error: error instanceof Error ? error.message : "Audio configuration could not load." });
      }
    })();
    return this.ready;
  }

  private loadBuffer(id: string, src: string, context: AudioContext) {
    let buffer = this.buffers.get(id);
    if (!buffer) {
      buffer = (async () => {
        const response = await this.dependencies.fetch(new URL(src, this.configUrl).href, { cache: "no-cache", signal: this.abort.signal });
        if (!response.ok) throw new Error(`Sound could not load (${response.status}).`);
        return context.decodeAudioData(await response.arrayBuffer());
      })();
      this.buffers.set(id, buffer);
      void buffer.catch(() => { this.buffers.delete(id); });
    }
    return buffer;
  }

  play(soundId: string): Promise<void> {
    return this.playSound(soundId, "demo");
  }

  handleButtonClick(target: EventTarget | null): Promise<void> {
    const button = target instanceof Element ? target.closest("button") : null;
    if (!button || button.matches(':disabled, [aria-disabled="true"]')) return Promise.resolve();
    return this.playSound(null, "feedback", button);
  }

  private async playSound(soundId: string | null, scope: Scope, button?: Element): Promise<void> {
    if (this.disposed) return;
    const request = Symbol();
    this.starts.set(request, { soundId, scope });
    this.publishCounts();
    try {
      const context = this.context ??= this.dependencies.createContext();
      // Resume before awaiting network work, while this call still has user activation.
      await Promise.all([context.resume(), this.load()]);
      if (this.disposed || !this.starts.has(request) || !this.snapshot.config) return;
      const config = this.snapshot.config;
      if (scope === "feedback") {
        if (!button?.matches(config.buttonClick.selector)) return;
        soundId = config.buttonClick.sound;
      } else if (!config.demo.includes(soundId!)) throw new Error("Unknown demo sound.");
      const sound = config.sounds.find((sound) => sound.id === soundId);
      if (!sound) throw new Error("Unknown audio sound.");
      if (sound.channel === "bgm") {
        if (this.bgmStart || [...this.voices].some((voice) => voice.channel === "bgm")) return;
        this.bgmStart = request;
      }
      const buffer = await this.loadBuffer(sound.id, sound.src, context);
      if (this.disposed || !this.starts.has(request)) return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.loop = scope === "demo" && (this.snapshot.loops[sound.id] ?? false);
      gain.gain.value = sound.gain;
      source.connect(gain);
      gain.connect(context.destination);
      const voice = { soundId: sound.id, channel: sound.channel, scope, source, gain };
      source.onended = () => this.release(voice);
      source.start();
      this.voices.add(voice);
      if (scope === "demo") this.publish({ error: null });
      this.publishCounts();
    } catch (error) {
      if (!this.disposed && this.starts.has(request)) this.publish({ error: error instanceof Error ? error.message : "Sound could not play." });
    } finally {
      if (this.bgmStart === request) this.bgmStart = null;
      this.starts.delete(request);
      this.publishCounts();
    }
  }

  private release(voice: Voice) {
    if (!this.voices.delete(voice)) return;
    voice.source.onended = null;
    voice.source.disconnect();
    voice.gain.disconnect();
    this.publishCounts();
  }

  setLoop(soundId: string, loop: boolean) {
    if (this.disposed || !this.snapshot.config?.demo.includes(soundId)) return;
    this.publish({ loops: Object.assign(Object.create(null), this.snapshot.loops, { [soundId]: loop }) });
    this.voices.forEach((voice) => { if (voice.scope === "demo" && voice.soundId === soundId) voice.source.loop = loop; });
  }

  stop(soundId: string) {
    this.starts.forEach((start, request) => {
      if (start.scope === "demo" && start.soundId === soundId) {
        this.starts.delete(request);
        if (this.bgmStart === request) this.bgmStart = null;
      }
    });
    this.voices.forEach((voice) => {
      if (voice.scope === "demo" && voice.soundId === soundId) { voice.source.stop(); this.release(voice); }
    });
    this.publishCounts();
  }

  stopAll() {
    const ids = new Set<string>();
    this.starts.forEach(({ soundId, scope }) => { if (scope === "demo" && soundId) ids.add(soundId); });
    this.voices.forEach((voice) => { if (voice.scope === "demo") ids.add(voice.soundId); });
    ids.forEach((id) => this.stop(id));
    this.publishCounts();
  }

  private publishCounts() {
    const active: Record<string, number> = Object.create(null);
    const pending: Record<string, number> = Object.create(null);
    let feedback = 0;
    this.voices.forEach((voice) => {
      if (voice.scope === "feedback") feedback++;
      else active[voice.soundId] = (active[voice.soundId] ?? 0) + 1;
    });
    this.starts.forEach(({ soundId, scope }) => { if (scope === "demo" && soundId) pending[soundId] = (pending[soundId] ?? 0) + 1; });
    this.publish({ active, pending, feedback });
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.abort.abort();
    this.listeners.clear();
    this.starts.clear();
    this.voices.forEach((voice) => { voice.source.stop(); this.release(voice); });
    this.publishCounts();
    this.buffers.clear();
    if (this.context) void this.context.close().catch(() => {});
  }
}
