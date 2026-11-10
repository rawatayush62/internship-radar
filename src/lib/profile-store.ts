"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Profile } from "@/types/opportunity";

interface ProfileStore {
  profile: Profile | null;
  hasHydrated: boolean;
  saveProfile: (profile: Profile) => void;
  resetProfile: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: null,
      hasHydrated: false,
      saveProfile: (profile) => set({ profile }),
      resetProfile: () => set({ profile: null }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated })
    }),
    {
      name: "internship-radar-profile",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ profile: state.profile }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
