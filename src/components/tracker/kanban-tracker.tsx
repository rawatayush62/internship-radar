"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import opportunityData from "../../../data/opportunities.json";
import {
  formatAbsoluteDate,
  getDaysUntilDeadline,
  isOpportunityClosed,
  isVerifiedOlderThan30Days
} from "@/lib/opportunity-display";
import { ReportOutdatedButton } from "@/components/opportunities/report-outdated-button";
import { TRACKER_STATUSES, useTrackerStore } from "@/lib/tracker-store";
import type {
  TrackedOpportunity,
  TrackerStatus
} from "@/lib/tracker-store";
import type { Opportunity } from "@/types/opportunity";

const opportunities = opportunityData as Opportunity[];

function getDaysRemaining(deadline: string, today: Date) {
  return getDaysUntilDeadline(deadline, today);
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  const days = getDaysRemaining(deadline, new Date());
  if (days === null) {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
        Deadline unavailable
      </span>
    );
  }

  const urgency =
    days < 0
      ? "bg-rose-50 text-rose-800"
      : days <= 7
        ? "bg-amber-50 text-amber-900"
        : "bg-slate-100 text-slate-700";
  const label =
    days < 0
      ? `Deadline passed ${Math.abs(days)} ${
          Math.abs(days) === 1 ? "day" : "days"
        } ago`
      : days === 0
        ? "Deadline today"
        : `${days} ${days === 1 ? "day" : "days"} left`;

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${urgency}`}
      title={formatAbsoluteDate(deadline)}
    >
      {label}
    </span>
  );
}

function TrackerCard({
  item,
  onMove,
  onRemove,
  onDragStart,
  onDragEnd,
  onKeyboardMove
}: {
  item: TrackedOpportunity;
  onMove: (opportunityId: string, status: TrackerStatus) => void;
  onRemove: (opportunityId: string) => void;
  onDragStart: (event: React.DragEvent<HTMLElement>, opportunityId: string) => void;
  onDragEnd: () => void;
  onKeyboardMove: (
    event: React.KeyboardEvent<HTMLElement>,
    opportunityId: string
  ) => void;
}) {
  const opportunity = opportunities.find(
    (candidate) => candidate.id === item.opportunityId
  );
  if (!opportunity) return null;
  const isClosed = isOpportunityClosed(opportunity);
  const daysUntilDeadline = getDaysRemaining(
    opportunity.application_deadline,
    new Date()
  );
  const verificationIsOld = isVerifiedOlderThan30Days(
    opportunity.last_verified_at
  );

  return (
    <article
      aria-label={`${opportunity.title}, ${item.status}`}
      className={`rounded-xl border bg-white p-4 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isClosed ? "opacity-70 grayscale-[0.4]" : ""
      }`}
      draggable
      onDragEnd={onDragEnd}
      onKeyDown={(event) => onKeyboardMove(event, item.opportunityId)}
      onDragStart={(event) => onDragStart(event, item.opportunityId)}
      tabIndex={0}
    >
      <p className="text-xs font-medium text-slate-500">
        {opportunity.organization}
      </p>
      <h3 className="mt-1 text-sm font-semibold leading-5 text-slate-950">
        {opportunity.title}
      </h3>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <DeadlineBadge deadline={opportunity.application_deadline} />
        {daysUntilDeadline !== null &&
          daysUntilDeadline >= 0 &&
          daysUntilDeadline <= 7 && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
              Closing soon
            </span>
          )}
      </div>
      <p
        className={`mt-2 text-xs ${
          verificationIsOld
            ? "font-semibold text-amber-800 dark:text-amber-300"
            : "text-slate-500"
        }`}
        title={formatAbsoluteDate(opportunity.last_verified_at)}
      >
        Last verified {formatAbsoluteDate(opportunity.last_verified_at)}
        {verificationIsOld && " · Older than 30 days"}
      </p>
      <div className="mt-3">
        <label
          className="mb-1 block text-xs font-medium text-slate-600"
          htmlFor={`tracker-status-${opportunity.id}`}
        >
          Move to
        </label>
        <select
          className="h-9 w-full rounded-lg border bg-white px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          id={`tracker-status-${opportunity.id}`}
          onChange={(event) =>
            onMove(
              opportunity.id,
              event.target.value as TrackerStatus
            )
          }
          value={item.status}
        >
          {TRACKER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Link
          className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href={opportunity.source_url}
          rel="noopener noreferrer"
          target="_blank"
        >
          Official source
        </Link>
        <button
          aria-label={`Remove ${opportunity.title} from tracker`}
          className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onRemove(opportunity.id)}
          type="button"
        >
          Remove
        </button>
      </div>
      <ReportOutdatedButton opportunity={opportunity} />
    </article>
  );
}

export function KanbanTracker() {
  const items = useTrackerStore((state) => state.items);
  const hasHydrated = useTrackerStore((state) => state.hasHydrated);
  const moveOpportunity = useTrackerStore((state) => state.moveOpportunity);
  const removeOpportunity = useTrackerStore((state) => state.removeOpportunity);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<TrackerStatus>("Saved");
  const [announcement, setAnnouncement] = useState("");
  const validItems = useMemo(
    () =>
      items.filter((item) =>
        opportunities.some((opportunity) => opportunity.id === item.opportunityId)
      ),
    [items]
  );

  function handleDrop(event: React.DragEvent<HTMLElement>, status: TrackerStatus) {
    event.preventDefault();
    const opportunityId =
      event.dataTransfer.getData("text/plain") || draggedId;
    if (opportunityId) moveOpportunity(opportunityId, status);
    setDraggedId(null);
  }

  function handleDragStart(
    event: React.DragEvent<HTMLElement>,
    opportunityId: string
  ) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", opportunityId);
    setDraggedId(opportunityId);
  }

  function handleKeyboardMove(
    event: React.KeyboardEvent<HTMLElement>,
    opportunityId: string
  ) {
    if (event.target !== event.currentTarget) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const item = validItems.find((candidate) => candidate.opportunityId === opportunityId);
    if (!item) return;
    const currentIndex = TRACKER_STATUSES.indexOf(item.status);
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextStatus = TRACKER_STATUSES[currentIndex + delta];
    if (!nextStatus) return;
    event.preventDefault();
    moveOpportunity(opportunityId, nextStatus);
    setActiveStatus(nextStatus);
    const title = opportunities.find(
      (opportunity) => opportunity.id === opportunityId
    )?.title;
    setAnnouncement(`${title ?? opportunityId} moved to ${nextStatus}.`);
  }

  if (!hasHydrated) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" role="status">
        <span className="sr-only">Loading your saved opportunities...</span>
        {TRACKER_STATUSES.map((status) => (
          <div
            className="h-64 animate-pulse rounded-2xl border bg-slate-100"
            key={status}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <p aria-live="polite" className="sr-only" role="status">
        {validItems.length} tracked opportunities.
        {draggedId ? " Opportunity selected for moving." : ""}
        {announcement}
      </p>
      <div
        aria-label="Application stages"
        className="mb-4 flex gap-2 overflow-x-auto pb-2 xl:hidden"
        role="tablist"
      >
        {TRACKER_STATUSES.map((status) => {
          const count = validItems.filter((item) => item.status === status).length;
          const selected = activeStatus === status;
          return (
            <button
              aria-controls={`tracker-panel-${status.toLowerCase()}`}
              aria-selected={selected}
              className={`min-h-10 shrink-0 rounded-full border px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-foreground"
              }`}
              id={`tracker-tab-${status.toLowerCase()}`}
              key={status}
              onClick={() => setActiveStatus(status)}
              role="tab"
              type="button"
            >
              {status} ({count})
            </button>
          );
        })}
      </div>
      <section
        aria-labelledby={`tracker-tab-${activeStatus.toLowerCase()}`}
        className="rounded-2xl border bg-slate-50 p-3 xl:hidden"
        id={`tracker-panel-${activeStatus.toLowerCase()}`}
        role="tabpanel"
        tabIndex={0}
      >
        <div className="space-y-3">
          {validItems
            .filter((item) => item.status === activeStatus)
            .map((item) => (
              <TrackerCard
                item={item}
                key={item.opportunityId}
                onDragEnd={() => setDraggedId(null)}
                onDragStart={handleDragStart}
                onKeyboardMove={handleKeyboardMove}
                onMove={moveOpportunity}
                onRemove={removeOpportunity}
              />
            ))}
          {validItems.every((item) => item.status !== activeStatus) && (
            <p className="rounded-xl border border-dashed bg-white/70 px-3 py-8 text-center text-sm leading-5 text-slate-500">
              No cards in {activeStatus}. Save an opportunity or move one here.
            </p>
          )}
        </div>
      </section>
      <p className="mb-3 text-xs text-muted-foreground">
        Keyboard: focus a card and press ← or → to move it between stages.
      </p>
      <div className="hidden items-start gap-4 xl:grid xl:grid-cols-5">
        {TRACKER_STATUSES.map((status) => {
          const columnItems = validItems.filter((item) => item.status === status);
          const headingId = `tracker-column-${status.toLowerCase()}`;

          return (
            <section
              aria-labelledby={headingId}
              className={`min-h-56 rounded-2xl border p-3 transition-colors ${
                draggedId ? "border-dashed border-blue-300 bg-blue-50/40" : "bg-slate-50"
              }`}
              key={status}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, status)}
            >
              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <h2
                  className="text-sm font-semibold text-slate-900"
                  id={headingId}
                >
                  {status}
                </h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                  {columnItems.length}
                </span>
              </div>
              <div className="space-y-3">
                {columnItems.map((item) => (
                  <TrackerCard
                    item={item}
                    key={item.opportunityId}
                    onDragEnd={() => setDraggedId(null)}
                    onDragStart={handleDragStart}
                    onKeyboardMove={handleKeyboardMove}
                    onMove={moveOpportunity}
                    onRemove={removeOpportunity}
                  />
                ))}
                {columnItems.length === 0 && (
                  <p className="rounded-xl border border-dashed bg-white/70 px-3 py-6 text-center text-xs leading-5 text-slate-500">
                    Drop an opportunity here or use the status menu on a card.
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
