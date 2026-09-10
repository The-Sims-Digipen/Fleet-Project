import { useCallback, useSyncExternalStore } from "react";
import type { Group } from "three";

export type ModelSnapshot =
  | { status: "loading"; attempt: number }
  | { status: "ready"; attempt: number; scene: Group }
  | { status: "error"; attempt: number; message: string };

// Only catalog URLs enter this session cache. Cached geometry/textures outlive instances.
export function createModelResources(load: (url: string) => Promise<Group>) {
  const entries = new Map<string, { snapshot: ModelSnapshot; listeners: Set<() => void>; started: boolean }>();
  const entryFor = (url: string) => {
    let entry = entries.get(url);
    if (!entry) {
      entry = { snapshot: { status: "loading", attempt: 0 }, listeners: new Set(), started: false };
      entries.set(url, entry);
    }
    return entry;
  };
  const publish = (url: string, snapshot: ModelSnapshot) => {
    const entry = entryFor(url);
    entry.snapshot = snapshot;
    entry.listeners.forEach((listener) => listener());
  };
  const start = (url: string) => {
    const entry = entryFor(url);
    entry.started = true;
    const attempt = entry.snapshot.attempt;
    void Promise.resolve().then(() => load(url)).then(
      (scene) => { if (entry.snapshot.attempt === attempt) publish(url, { status: "ready", attempt, scene }); },
      (error: unknown) => { if (entry.snapshot.attempt === attempt) publish(url, { status: "error", attempt, message: error instanceof Error ? error.message : "Unable to load model" }); },
    );
  };
  return {
    getSnapshot: (url: string) => entryFor(url).snapshot,
    subscribe(url: string, listener: () => void) {
      const entry = entryFor(url);
      entry.listeners.add(listener);
      if (!entry.started) start(url);
      return () => { entry.listeners.delete(listener); };
    },
    retry(url: string) {
      const entry = entryFor(url);
      if (entry.started && entry.snapshot.status === "loading") return;
      publish(url, { status: "loading", attempt: entry.snapshot.attempt + 1 });
      start(url);
    },
    reportError(url: string, message: string) {
      publish(url, { status: "error", attempt: entryFor(url).snapshot.attempt, message });
    },
  };
}

export const modelResources = createModelResources(async (url) => {
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  return (await new GLTFLoader().loadAsync(url)).scene;
});

export function useModelResource(url: string) {
  return useSyncExternalStore(
    useCallback((listener) => modelResources.subscribe(url, listener), [url]),
    useCallback(() => modelResources.getSnapshot(url), [url]),
  );
}
