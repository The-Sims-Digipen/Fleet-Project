import { create } from "zustand";
import { END_YEAR, START_YEAR } from "../project/analysisPeriod";

export { END_YEAR, START_YEAR };

type TimelineState = {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  resetYear: () => void;
};

/** Shared year navigation state. The period and events are mock data until simulation inputs exist. */
export const useTimelineStore = create<TimelineState>((set) => ({
  selectedYear: START_YEAR,
  setSelectedYear: (year) => {
    if (Number.isFinite(year)) set({ selectedYear: Math.max(START_YEAR, Math.min(END_YEAR, Math.round(year))) });
  },
  resetYear: () => set({ selectedYear: START_YEAR }),
}));
