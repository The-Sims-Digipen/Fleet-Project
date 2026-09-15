import { create } from "zustand";

export const START_YEAR = 2026;
export const END_YEAR = 2035;

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
