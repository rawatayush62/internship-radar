"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const TRACKER_STATUSES = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected"
] as const;

export type TrackerStatus = (typeof TRACKER_STATUSES)[number];

export interface TrackedOpportunity {
  opportunityId: string;
  status: TrackerStatus;
  addedAt: string;
  updatedAt: string;
}

interface TrackerStore {
  items: TrackedOpportunity[];
  hasHydrated: boolean;
  addOpportunity: (opportunityId: string) => void;
  moveOpportunity: (opportunityId: string, status: TrackerStatus) => void;
  removeOpportunity: (opportunityId: string) => void;
  clearTracker: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useTrackerStore = create<TrackerStore>()(
  persist(
    (set) => ({
      items: [],
      hasHydrated: false,
      addOpportunity: (opportunityId) =>
        set((state) => {
          if (state.items.some((item) => item.opportunityId === opportunityId)) {
            return state;
          }
          const now = new Date().toISOString();
          return {
            items: [
              ...state.items,
              { opportunityId, status: "Saved", addedAt: now, updatedAt: now }
            ]
          };
        }),
      moveOpportunity: (opportunityId, status) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.opportunityId === opportunityId
              ? { ...item, status, updatedAt: new Date().toISOString() }
              : item
          )
        })),
      removeOpportunity: (opportunityId) =>
        set((state) => ({
          items: state.items.filter(
            (item) => item.opportunityId !== opportunityId
          )
        })),
      clearTracker: () => set({ items: [] }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated })
    }),
    {
      name: "internship-radar-tracker",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
