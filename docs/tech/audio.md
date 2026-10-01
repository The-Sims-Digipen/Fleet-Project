# M1 audio

## Agreed scope

This implementation supports the optional rubric audio modifiers.

- Every enabled application button activation receives the supplied UI click sound. Normal use requires no other audio.
- The production sidebar Audio demo panel plays background music with at least eight simultaneous sound effects.
- Background music starts only through Audio demo. Normal fleet use does not start background music.
- Use the supplied WAV files. Do not generate placeholder sounds.
- The engine reads sound files and playback bindings from runtime data/configuration. Sound-file replacement and binding changes must not require an application rebuild.
- A new sound must not stop an existing sound.
- Audio demo provides individual Play, Stop, and Loop controls for the supplied BGM and each of the eight supplied SFX. The user starts tracks manually. A combined Run demo action is not required.
- Panel collapse and workspace changes do not stop playback. Tracks without loops end naturally. Explicit Stop controls also end playback.

## Assets

The UI click file is `apps/client/public/audio/ui-click.wav`. Supplied demo tracks retain their original names in `apps/client/public/audio/demo/`.

## Implementation design

- Use a small Web Audio engine that the client owns. Use one audio context. Use one independent BGM voice. Allocate a fresh SFX voice for each activation. At least eight SFX can overlap, including repeated playback of the same sound. A later activation must not stop an earlier voice.
- Fetch `public/audio/config.json` at runtime. This file contains the sound catalogue, URLs, gains, button-click selector/event binding, and demo track bindings. The panel derives its track list from this data. It does not contain fixed filenames or a fixed set of eight controls.
- Button-click feedback covers every enabled application button. These buttons include tabs, collapsible headers, modal actions, nested button content, and keyboard activation. Disabled controls and other interactions do not produce button feedback. Sound load failures must not prevent the button action.
- Give each demo track Play and Stop buttons. Add a Loop checkbox with an initial unchecked state. SFX Play starts another independent instance. BGM Play is unavailable while BGM plays. Stop ends all demo instances of that track. A Loop change updates current demo instances and new playback for that track.
- Include Stop all for demo playback. Show live BGM/SFX voice counts. Normal UI click playback is independent of demo controls.
- Compose an isolated `AudioDemoPanel` into `Sidebar` with `CollapsibleSection`. Set its initial state to collapsed. The application shell owns the engine. Panel hide or unmount does not dispose playback. Runtime audio and loop choices do not enter the Project document, saved data, or undo history.
- Use conservative configured gains for background music and SFX. Show load, decode, and configuration failures in the demo panel. Normal fleet use remains available.
- Dispose audio voices on teardown. Dispose subscriptions on teardown. Dispose the audio context on teardown. React Strict Mode setup/cleanup must not produce duplicate button sounds or leaked playback.

## Verification

- Validate the runtime configuration.
- Validate supplied track decode behavior.
- Test button feedback for nested targets, keyboard activation, disabled buttons, and modal buttons. Normal button actions must remain unchanged.
- Test one BGM with eight independent SFX.
- Test repeated SFX activation without a stop to earlier voices.
- Test live loop changes.
- Test explicit Stop controls.
- Test continued playback while the panel is hidden.
- Verify real browser playback with eight SFX loops and BGM.
- Trigger additional button feedback while these voices remain active.
- Build the production client.
- Replace a sound binding/file in the served `dist/audio/` directory.
- Reload the page without a JavaScript rebuild.
- Confirm that the runtime configuration change applies.
- Run the repository verification checks.
- Report the checks that completed.

## Demonstrate rubric audio

1. In Plan / Depot, open **Audio demo** in the sidebar.
2. Select **Loop** for BGM.
3. Select **Loop** for all eight SFX.
4. Press each track's **Play** button. The counter must show **BGM: 1 · SFX: 8**.
5. Activate another normal application button. Its UI click plays with the demo and does not interrupt it.
6. Press an SFX **Play** button again. Instances of the same clip must overlap.
7. Clear Loop on an active track. That voice finishes its current playback naturally.
8. Press a track's Stop button. Stop ends all demo instances of that track.
9. Press Stop all demo sounds. This control ends all demo playback. Normal click feedback remains available.
10. Collapse the panel. Demo playback and loop choices remain active.
11. Open the panel again.
12. Switch to Compare. Demo playback and loop choices remain active.
13. Return to Plan / Depot. Demo playback remains active until an explicit Stop command or natural completion.

## Replace sounds without a rebuild

The engine fetches the manifest from `/audio/config.json`. Sound paths are relative to that file. Each sound has a unique ID, display label, source path, BGM/SFX channel, and gain between zero and one. `buttonClick` maps a button selector to a catalogue sound ID. `demo` lists the catalogue IDs for panel tracks. Loop choices belong to the session and default to off.

For development:

1. Change `apps/client/public/audio/config.json`.
2. Add or replace WAVs under that directory.
3. Reload the page.

For an existing production build:

1. Change the served `dist/audio/config.json`.
2. Add or replace files under `dist/audio/`.
3. Reload the page.

These changes require no JavaScript rebuild. The manifest uses `no-store`. Sound requests use `no-cache` for revalidation. The engine reuses decoded buffers within the page session. Reload the page after a file replacement.

Use `/audio/` for these mutable files. Production Nginx reserves `/assets/` for immutable build assets with hash filenames. Missing sound files or an SPA HTML fallback cause a visible audio error. Normal application actions remain available.

## Verification results

These historical results record the run on 1 October 2026. They do not report a new verification run.

Verified on 1 October 2026:

- `pnpm verify`: all workspace typechecks and builds passed. 255 tests passed. Two PostgreSQL migration tests were skipped because no test database was configured.
- Chrome: all nine supplied demo WAVs decoded and produced non-zero Web Audio output samples. Nine independent sources with active loops matched **BGM: 1 · SFX: 8**. No audio errors occurred.
- Further button clicks, panel collapse, and a Plan → Compare → Plan switch stopped none of the original nine voices. The audio context stayed active. Its playback time advanced.
- The production preview test changed the served manifest's button binding, source filename, and one demo label. The test then reloaded the page. The UI showed the new label and fetched the replacement WAV. It decoded the replacement's 0.4059375-second buffer. SHA256 hashes of every built JavaScript file stayed unchanged. The test restored the original manifest afterward.
- Automated tests cover configuration validation, repeated/overlapping playback, pending-start cancellation, live loop changes, natural completion, and decode failure/retry. They also cover Strict Mode setup/cleanup, keyboard/nested/disabled button targets, and demo playback after a sidebar unmount.
