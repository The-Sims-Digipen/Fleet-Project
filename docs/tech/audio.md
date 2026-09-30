# M1 audio

## Agreed scope

- Every enabled button activation in the application receives the supplied UI click sound. No other normal-use audio is required.
- A production sidebar Audio demo panel demonstrates background music alongside at least eight simultaneous sound effects.
- Background music starts only through the Audio demo; it does not accompany normal fleet planning.
- Use the supplied WAV files. Do not generate placeholder sounds.
- The engine must read both sound files and their playback bindings from runtime data/configuration. Replacing sound files or changing their bindings must not require recompiling the application.
- Starting a new sound must not cut off an existing sound.
- The Audio demo provides individual Play, Stop, and Loop controls for the supplied BGM and each of the eight supplied SFX. Tracks are started manually; no combined Run demo action is required.
- Collapsing the panel or switching workspaces does not stop playback. Playback ends naturally for non-looping tracks or through explicit Stop controls.

## Assets

The UI click is stored at `apps/client/public/audio/ui-click.wav`. Supplied demonstration tracks are stored in `apps/client/public/audio/demo/` with their original names.

## Implementation design

- Use a small client-owned Web Audio engine with a single audio context, one independently controlled BGM voice, and a fresh SFX voice for every activation. At least eight SFX can overlap, including repeated playback of the same sound; a later activation never steals an earlier voice.
- Fetch `public/audio/config.json` at runtime. It contains the sound catalogue, URLs, gains, button-click selector/event binding, and demo track bindings. The panel renders its track list from this data rather than hard-coding filenames or eight controls.
- Button click feedback covers every enabled application button, including tabs, collapsible headers, modal actions, nested button content, and keyboard activation. Disabled controls and non-button interactions do not produce button feedback. Sound loading/failure never prevents the button's application action.
- Each demo track has Play and Stop buttons and a Loop checkbox, initially unchecked. Play starts another independent SFX instance; BGM Play is unavailable while BGM is already playing. Stop ends all demo instances of that track. Changing Loop updates that track's existing demo instances as well as future playback.
- Include Stop all for demo playback and live BGM/SFX voice counts. Normal UI click playback is independent of the demo controls.
- Compose an isolated, initially collapsed `AudioDemoPanel` into `Sidebar` with the existing `CollapsibleSection`. The application shell owns the engine, so hiding/unmounting the panel does not dispose its playback. Runtime audio and loop choices are not part of the Project document, save data, or undo history.
- Keep background music and SFX at conservative configured gains. Show load/decode/configuration failures in the demo panel; normal fleet planning remains available.
- Dispose audio voices, subscriptions, and the audio context when the application audio integration is torn down. Handle React Strict Mode setup/cleanup without duplicate button sounds or leaked playback.

## Verification

- Validate the runtime config and supplied track decoding.
- Test button feedback for nested targets, keyboard activation, disabled buttons, and modal buttons without changing normal actions.
- Test one BGM plus eight independent SFX, repeated SFX activation without stopping prior voices, loop changes, explicit Stop, and continued playback when the demo panel hides.
- Verify real browser playback with eight looping demo SFX and BGM, then trigger additional button feedback while those voices remain active.
- Build the production client, then replace a sound binding/file in the served `dist/audio/` directory and reload without rebuilding JavaScript to demonstrate the runtime pipeline.
- Run the repository verification checks and report the checks actually completed.

## Demonstrating the rubric

1. In Plan / Depot, open **Audio demo** in the sidebar.
2. Check **Loop** on the BGM and all eight SFX, then press each track's **Play** button. The counter should show **BGM: 1 · SFX: 8**.
3. Activate another normal application button. Its UI click plays alongside the demo without interrupting it. Press an SFX's Play button again to demonstrate overlapping instances of the same clip.
4. Toggle Loop on a playing track; clearing it lets that voice finish its current playback naturally. Each track's Stop ends all its demo instances; Stop all demo sounds ends the whole demo while leaving ordinary click feedback available.
5. Collapse the panel or switch to Compare, then return. Loop choices and demo playback remain active until explicitly stopped.

## Replacing sounds without recompilation

The manifest is fetched from `/audio/config.json`; its sound paths resolve relative to that file. Each sound has a unique ID, display label, source path, BGM/SFX channel, and gain between zero and one. `buttonClick` maps a button selector to a catalogue sound ID. `demo` lists the catalogue IDs rendered in the panel. Loop choices are session state and default to off.

During development, change `apps/client/public/audio/config.json` and add/replace WAVs under that directory. For an existing production build, change the served `dist/audio/config.json` and files under `dist/audio/`, then reload the page. No JavaScript rebuild is required. The manifest uses `no-store`; sound requests revalidate with `no-cache`. Decoded buffers are reused within the current page session, so reload after replacing files.

Use `/audio/` for these mutable files. Production Nginx reserves `/assets/` for immutable hashed build assets. Missing sound files or an SPA HTML fallback cause a visible audio error without preventing normal application actions.

## Verification results

Verified on 1 October 2026:

- `pnpm verify`: all workspace typechecks and builds passed; 255 tests passed. Two PostgreSQL migration tests were skipped because no test database was configured.
- Chrome: all nine supplied demo WAVs decoded and produced non-zero Web Audio output samples. Nine independently looping sources matched **BGM: 1 · SFX: 8** with no audio errors.
- Further button clicks, panel collapse, and a Plan → Compare → Plan switch stopped none of the original nine voices; the audio context remained running and its playback time advanced.
- Production preview: changed the served manifest's button binding, source filename, and one demo label, then reloaded. The UI reflected the changed label, fetched the replacement WAV, and decoded the replacement's 0.4059375-second buffer. SHA256 hashes of every built JavaScript file stayed unchanged. Restored the original manifest afterward.
- Automated coverage includes configuration validation, repeat/overlapping playback, pending-start cancellation, live loop changes, natural completion, decode failure/retry, Strict Mode setup/cleanup, keyboard/nested/disabled button targets, and demo playback surviving sidebar unmounts.
