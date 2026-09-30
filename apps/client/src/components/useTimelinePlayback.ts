import { useEffect } from "react";

/** Advances one workspace's canonical timeline and stops at its final year. */
export function useTimelinePlayback({
  playing,
  endYear,
  getSelectedYear,
  setSelectedYear,
  setPlaying,
}: {
  playing: boolean;
  endYear: number;
  getSelectedYear: () => number;
  setSelectedYear: (year: number) => void;
  setPlaying: (playing: boolean) => void;
}): void {
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const selectedYear = getSelectedYear();
      if (selectedYear >= endYear) setPlaying(false);
      else setSelectedYear(selectedYear + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [endYear, getSelectedYear, playing, setPlaying, setSelectedYear]);
}
