import type { Opportunity } from "@/types/opportunity";

const DAY_MS = 86_400_000;

export function getDaysUntilDeadline(deadline: string, now = new Date()) {
  const deadlineMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(deadline);
  if (!deadlineMatch || !Number.isFinite(now.getTime())) return null;

  const [, yearText, monthText, dayText] = deadlineMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const deadlineDate = new Date(Date.UTC(year, month - 1, day));
  if (
    deadlineDate.getUTCFullYear() !== year ||
    deadlineDate.getUTCMonth() !== month - 1 ||
    deadlineDate.getUTCDate() !== day
  ) {
    return null;
  }

  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.ceil((deadlineDate.getTime() - today) / DAY_MS);
}

export function getDeadlineLabel(deadline: string, now = new Date()) {
  const days = getDaysUntilDeadline(deadline, now);
  if (days === null) return "Deadline unavailable";
  if (days < 0) return `Closed ${Math.abs(days)} ${
    Math.abs(days) === 1 ? "day" : "days"
  } ago`;
  if (days === 0) return "Closing today";
  return `Closing in ${days} ${days === 1 ? "day" : "days"}`;
}

export function isOpportunityClosed(opportunity: Opportunity, now = new Date()) {
  const days = getDaysUntilDeadline(opportunity.application_deadline, now);
  return days !== null && days < 0;
}

export function isVerifiedOlderThan30Days(
  lastVerifiedAt: string,
  now = new Date()
) {
  const verifiedAt = Date.parse(`${lastVerifiedAt}T00:00:00Z`);
  if (!Number.isFinite(verifiedAt) || !Number.isFinite(now.getTime())) return true;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return today - verifiedAt > 30 * DAY_MS;
}

export function formatAbsoluteDate(date: string) {
  const value = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(value.getTime())) return date;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(value);
}
