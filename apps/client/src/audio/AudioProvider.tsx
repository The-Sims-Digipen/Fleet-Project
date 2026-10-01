import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { AudioEngine, type AudioSnapshot } from "./audioEngine";

const AudioContext = createContext<AudioEngine | null>(null);
const loadingSnapshot: AudioSnapshot = { status: "loading", config: null, error: null, active: {}, loops: {}, pending: {}, feedback: 0 };
const getLoadingSnapshot = () => loadingSnapshot;
const subscribeLoading = () => () => {};

export function AudioProvider({ children }: { children: ReactNode }) {
  const [engine, setEngine] = useState<AudioEngine | null>(null);
  useEffect(() => {
    const audio = new AudioEngine(`${import.meta.env.BASE_URL}audio/config.json`);
    setEngine(audio);
    void audio.load();
    const onClick = (event: MouseEvent) => { void audio.handleButtonClick(event.target); };
    // Capture includes modal buttons and runs before handlers remove/disable them.
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      audio.dispose();
    };
  }, []);
  return <AudioContext.Provider value={engine}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const engine = useContext(AudioContext);
  const snapshot = useSyncExternalStore(engine?.subscribe ?? subscribeLoading, engine?.getSnapshot ?? getLoadingSnapshot);
  return { engine, snapshot };
}
