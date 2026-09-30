import { useAudio } from "../audio/AudioProvider";
import { CollapsibleSection } from "./CollapsibleSection";
import { topBarControl } from "./topBarStyles";

export function AudioDemoPanel() {
  const { engine, snapshot } = useAudio();
  const tracks = snapshot.config?.demo.map((id) => snapshot.config!.sounds.find((sound) => sound.id === id)!) ?? [];
  const bgm = tracks.filter((track) => track.channel === "bgm").reduce((sum, track) => sum + (snapshot.active[track.id] ?? 0), 0);
  const sfx = tracks.filter((track) => track.channel === "sfx").reduce((sum, track) => sum + (snapshot.active[track.id] ?? 0), 0);
  const loadingBgm = tracks.some((track) => track.channel === "bgm" && snapshot.pending[track.id]);
  const pending = Object.values(snapshot.pending).reduce((sum, count) => sum + count, 0);

  return <CollapsibleSection panelId="audio-demo" title="Audio demo" description="Enable Loop and play the BGM and eight effects individually to hear them together. Playback continues when this panel is hidden.">
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <output aria-label="Active demo playback" className="font-mono text-xs text-accent tabular-nums">BGM: {bgm} · SFX: {sfx}</output>
        <button type="button" className={topBarControl} disabled={bgm + sfx + pending === 0} onClick={() => engine?.stopAll()}>Stop all demo sounds</button>
      </div>
      {snapshot.status === "loading" && <p role="status" className="text-xs text-secondary">Loading audio…</p>}
      {snapshot.error && <p role="alert" className="rounded border border-red-400/40 bg-red-400/10 p-3 text-xs text-red-300">{snapshot.error}</p>}
      <ul aria-label="Demo tracks" className="m-0 grid list-none gap-2 p-0">
        {tracks.map((track) => {
          const active = snapshot.active[track.id] ?? 0;
          const loading = snapshot.pending[track.id] ?? 0;
          return <li key={track.id} className="grid gap-2 rounded-lg border border-line-strong bg-control/50 p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 text-xs font-semibold text-primary">{track.label}</span>
              <span className="shrink-0 font-mono text-[0.65rem] text-secondary">{track.channel.toUpperCase()} · {active} playing</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={topBarControl} aria-label={`Play ${track.label}`} disabled={track.channel === "bgm" && (bgm > 0 || loadingBgm)} onClick={() => { void engine?.play(track.id); }}>Play</button>
              <button type="button" className={topBarControl} aria-label={`Stop ${track.label}`} disabled={active + loading === 0} onClick={() => engine?.stop(track.id)}>Stop</button>
              <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-secondary">
                <input type="checkbox" className="size-4 accent-accent" aria-label={`Loop ${track.label}`} checked={snapshot.loops[track.id] ?? false} onChange={(event) => engine?.setLoop(track.id, event.target.checked)} />Loop
              </label>
            </div>
            {loading > 0 && <p role="status" className="text-[0.65rem] text-secondary">Loading {track.label}…</p>}
          </li>;
        })}
      </ul>
    </div>
  </CollapsibleSection>;
}
