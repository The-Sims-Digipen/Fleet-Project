export type AudioSound = {
  id: string;
  label: string;
  src: string;
  channel: "bgm" | "sfx";
  gain: number;
};

export type AudioConfig = {
  version: 1;
  sounds: AudioSound[];
  buttonClick: { selector: string; sound: string };
  demo: string[];
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid audio configuration object.");
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("Audio configuration requires non-empty names and paths.");
  return value;
}

export function parseAudioConfig(value: unknown): AudioConfig {
  const root = record(value);
  if (root.version !== 1 || !Array.isArray(root.sounds) || !Array.isArray(root.demo)) throw new Error("Unsupported or invalid audio configuration.");
  const sounds = root.sounds.map((value: unknown): AudioSound => {
    const sound = record(value);
    if (sound.channel !== "bgm" && sound.channel !== "sfx") throw new Error("Invalid audio channel.");
    if (typeof sound.gain !== "number" || !Number.isFinite(sound.gain) || sound.gain < 0 || sound.gain > 1) throw new Error("Audio gain must be between 0 and 1.");
    return { id: text(sound.id), label: text(sound.label), src: text(sound.src), channel: sound.channel, gain: sound.gain };
  });
  const ids = new Set(sounds.map((sound) => sound.id));
  if (ids.size !== sounds.length) throw new Error("Audio sound IDs must be unique.");
  const binding = record(root.buttonClick);
  const buttonClick = { selector: text(binding.selector), sound: text(binding.sound) };
  try { document.createElement("button").matches(buttonClick.selector); }
  catch { throw new Error("Invalid button audio selector."); }
  if (!sounds.some((sound) => sound.id === buttonClick.sound && sound.channel === "sfx")) throw new Error("Button audio must reference an SFX sound.");
  const demo = root.demo.map(text);
  if (new Set(demo).size !== demo.length || demo.some((id) => !ids.has(id))) throw new Error("Demo audio must reference unique sound IDs.");
  return { version: 1, sounds, buttonClick, demo };
}
