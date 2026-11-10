"use client";

import Link from "next/link";
import { BookmarkCheck, BookmarkPlus } from "lucide-react";
import { useTrackerStore } from "@/lib/tracker-store";

export function TrackerAction({
  opportunityId,
  disabled = false
}: {
  opportunityId: string;
  disabled?: boolean;
}) {
  const isTracked = useTrackerStore((state) =>
    state.items.some((item) => item.opportunityId === opportunityId)
  );
  const hasHydrated = useTrackerStore((state) => state.hasHydrated);
  const addOpportunity = useTrackerStore((state) => state.addOpportunity);

  if (!hasHydrated) {
    return (
      <span className="inline-flex h-9 items-center rounded-lg border px-3 text-xs font-medium text-slate-400">
        Loading tracker…
      </span>
    );
  }

  if (isTracked) {
    return (
      <Link
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href="/tracker"
      >
        <BookmarkCheck aria-hidden="true" className="size-3.5" />
        In tracker
      </Link>
    );
  }

  return (
    <button
      aria-label={
        disabled
          ? "This opportunity is closed and cannot be saved"
          : "Save to tracker"
      }
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      onClick={() => addOpportunity(opportunityId)}
      disabled={disabled}
      type="button"
    >
      {disabled ? null : <BookmarkPlus aria-hidden="true" className="size-3.5" />}
      {disabled ? "Closed" : "Save to tracker"}
    </button>
  );
}
