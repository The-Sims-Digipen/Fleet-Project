import { StrictMode, useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AudioProvider } from "./AudioProvider";
import { AudioDemoPanel } from "../components/AudioDemoPanel";
import { DEFAULT_SIDEBAR_PANELS, useAppStore } from "../state/appStore";
import { createAudioHarness } from "../test/audioHarness";

beforeEach(() => {
  useAppStore.setState({ sidebarPanels: { ...DEFAULT_SIDEBAR_PANELS, "audio-demo": true } });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("provides manual looping tracks that keep playing when the sidebar unmounts", async () => {
  const { context, fetcher } = createAudioHarness();
  vi.stubGlobal("fetch", fetcher);
  vi.stubGlobal("AudioContext", class { constructor() { return context; } });
  function Workspace() {
    const [showPanel, setShowPanel] = useState(true);
    return <><button onClick={() => setShowPanel(!showPanel)}>Switch workspace</button>{showPanel && <AudioDemoPanel />}</>;
  }
  const user = userEvent.setup();
  render(<StrictMode><AudioProvider><Workspace /></AudioProvider></StrictMode>);
  await screen.findByRole("button", { name: "Play Music" });
  await user.click(screen.getByRole("checkbox", { name: "Loop Music" }));
  await user.click(screen.getByRole("button", { name: "Play Music" }));
  for (let i = 0; i < 8; i++) {
    await user.click(screen.getByRole("checkbox", { name: `Loop Effect ${i}` }));
    await user.click(screen.getByRole("button", { name: `Play Effect ${i}` }));
  }
  await waitFor(() => expect(screen.getByLabelText("Active demo playback")).toHaveTextContent("BGM: 1 · SFX: 8"));
  await user.click(screen.getByRole("button", { name: "Audio demo" }));
  expect(screen.getByRole("button", { name: "Audio demo" })).toHaveAttribute("aria-expanded", "false");
  await user.click(screen.getByRole("button", { name: "Switch workspace" }));
  await user.click(screen.getByRole("button", { name: "Switch workspace" }));
  await user.click(screen.getByRole("button", { name: "Audio demo" }));
  expect(screen.getByLabelText("Active demo playback")).toHaveTextContent("BGM: 1 · SFX: 8");
  expect(screen.getByRole("checkbox", { name: "Loop Effect 0" })).toBeChecked();
  await user.click(screen.getByRole("button", { name: "Stop all demo sounds" }));
  expect(screen.getByLabelText("Active demo playback")).toHaveTextContent("BGM: 0 · SFX: 0");
});

it("plays once per pointer/keyboard activation under Strict Mode and cleans up on unmount", async () => {
  const { context, fetcher, sources } = createAudioHarness();
  vi.stubGlobal("fetch", fetcher);
  vi.stubGlobal("AudioContext", class { constructor() { return context; } });
  const action = vi.fn();
  const user = userEvent.setup();
  const view = render(<StrictMode><AudioProvider><button onClick={action}><span>Action</span></button><button disabled>Disabled</button></AudioProvider></StrictMode>);
  await waitFor(() => expect(fetcher).toHaveBeenCalled());
  await user.click(screen.getByText("Action"));
  await waitFor(() => expect(sources).toHaveLength(1));
  await user.keyboard("{Enter}");
  await waitFor(() => expect(sources).toHaveLength(2));
  await user.click(screen.getByRole("button", { name: "Disabled" }));
  expect(action).toHaveBeenCalledTimes(2);
  expect(sources).toHaveLength(2);
  view.unmount();
  expect(context.close).toHaveBeenCalledOnce();
  const button = document.createElement("button");
  document.body.append(button);
  fireEvent.click(button);
  expect(sources).toHaveLength(2);
  button.remove();
});
