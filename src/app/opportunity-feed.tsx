"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { useTransition } from "react";
import opportunityData from "../../data/opportunities.json";
import { MatchCard } from "@/components/opportunities/match-card";
import { ReportOutdatedButton } from "@/components/opportunities/report-outdated-button";
import { TrackerAction } from "@/components/tracker/tracker-action";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { computeMatch } from "@/lib/compute-match";
import {
  formatAbsoluteDate,
  getDeadlineLabel,
  getDaysUntilDeadline,
  isOpportunityClosed,
  isVerifiedOlderThan30Days
} from "@/lib/opportunity-display";
import { useProfileStore } from "@/lib/profile-store";
import type {
  AcademicYear,
  Opportunity,
  OpportunityType
} from "@/types/opportunity";

const opportunities = opportunityData as Opportunity[];

const opportunityTypes: OpportunityType[] = [
  "internship",
  "hackathon",
  "research",
  "scholarship",
  "competition",
  "open_source"
];

const deadlineOptions = [7, 14, 30, 60, 90];
const yearOptions: AcademicYear[] = [1, 2, 3, 4, 5];

const branches = Array.from(
  new Set(
    opportunities.flatMap((opportunity) =>
      opportunity.eligible_branches.filter(
        (branch) => branch !== "*" && branch !== "related"
      )
    )
  )
).sort();

const locations = Array.from(
  new Set([
    ...opportunities.map((opportunity) => opportunity.location),
    "Remote"
  ])
).sort();

const filterKeys = ["q", "type", "year", "branch", "location", "days", "sort"];

interface FeedFilters {
  q: string;
  type: string;
  year: string;
  branch: string;
  location: string;
  days: string;
  sort: string;
}

function getFilters(searchParams: URLSearchParams): FeedFilters {
  const rawType = searchParams.get("type") ?? "";
  const rawYear = searchParams.get("year") ?? "";
  const rawBranch = searchParams.get("branch") ?? "";
  const rawLocation = searchParams.get("location") ?? "";
  const rawDays = searchParams.get("days") ?? "";

  return {
    q: searchParams.get("q") ?? "",
    type: opportunityTypes.includes(rawType as OpportunityType) ? rawType : "",
    year: yearOptions.some((year) => String(year) === rawYear) ? rawYear : "",
    branch: branches.includes(rawBranch) ? rawBranch : "",
    location: locations.includes(rawLocation) ? rawLocation : "",
    days: deadlineOptions.some((days) => String(days) === rawDays)
      ? rawDays
      : "",
    sort:
      searchParams.get("sort") === "recommended" ||
      searchParams.get("sort") === "deadline"
        ? searchParams.get("sort") ?? ""
        : ""
  };
}

function formatLabel(value: string) {
  if (value === "open_source") return "Open source";
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function matchesBranch(opportunity: Opportunity, branch: string) {
  return opportunity.eligible_branches.some(
    (eligibleBranch) =>
      eligibleBranch === "*" ||
      eligibleBranch === "related" ||
      eligibleBranch.toLowerCase() === branch.toLowerCase() ||
      branch.toLowerCase().includes(eligibleBranch.toLowerCase())
  );
}

function isWithinDays(deadline: string, days: number) {
  const deadlineTime = Date.parse(`${deadline}T00:00:00Z`);
  if (!Number.isFinite(deadlineTime)) return false;

  const now = new Date();
  const todayTime = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const dayDifference = Math.floor((deadlineTime - todayTime) / 86_400_000);

  return dayDifference >= 0 && dayDifference <= days;
}

function filterOpportunities(
  items: Opportunity[],
  filters: FeedFilters
): Opportunity[] {
  const query = filters.q.trim().toLowerCase();
  const deadlineDays = filters.days ? Number(filters.days) : null;

  return items.filter((opportunity) => {
    if (filters.type && opportunity.type !== filters.type) return false;
    if (
      filters.year &&
      !opportunity.eligible_years.includes(Number(filters.year) as AcademicYear)
    ) {
      return false;
    }
    if (filters.branch && !matchesBranch(opportunity, filters.branch)) {
      return false;
    }
    if (filters.location) {
      const locationMatches =
        filters.location === "Remote"
          ? opportunity.remote ||
            opportunity.location.toLowerCase().includes("remote")
          : opportunity.location
              .toLowerCase()
              .includes(filters.location.toLowerCase());
      if (!locationMatches) return false;
    }
    if (
      deadlineDays !== null &&
      !isWithinDays(opportunity.application_deadline, deadlineDays)
    ) {
      return false;
    }
    if (query) {
      const searchableContent = [
        opportunity.title,
        opportunity.organization,
        opportunity.description,
        opportunity.location,
        ...opportunity.required_skills,
        ...opportunity.preferred_skills
      ]
        .join(" ")
        .toLowerCase();
      if (!searchableContent.includes(query)) return false;
    }

    return true;
  });
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const now = new Date();
  const isClosed = isOpportunityClosed(opportunity, now);
  const deadlineDays = getDaysUntilDeadline(
    opportunity.application_deadline,
    now
  );
  const verifiedIsOld = isVerifiedOlderThan30Days(
    opportunity.last_verified_at,
    now
  );

  return (
    <article
      className={`group flex h-full min-w-0 flex-col rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md sm:p-6 ${
        isClosed ? "opacity-70 grayscale-[0.4]" : "hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <Sparkles aria-hidden="true" className="size-3.5" />
          {formatLabel(opportunity.type)}
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 7 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
              <Clock3 aria-hidden="true" className="size-3.5" />
              Closing soon
            </span>
          )}
          {isClosed && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              Closed
            </span>
          )}
          {opportunity.remote && (
            <span className="rounded-full border px-2.5 py-1 text-xs font-medium text-slate-600">
              Remote
            </span>
          )}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-500">
          {opportunity.organization}
        </p>
        <h2 className="mt-1 text-lg font-semibold leading-6 tracking-tight text-slate-950">
          {opportunity.title}
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
          {opportunity.description}
        </p>
      </div>

      <div
        aria-label="Opportunity details"
        className="mt-5 grid gap-3 border-t pt-4 text-sm"
      >
        <div className="flex items-start gap-2.5 text-slate-600">
          <CalendarDays
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-slate-400"
          />
          <div>
            <p
              className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1"
              title={formatAbsoluteDate(opportunity.application_deadline)}
            >
              <span className="sr-only">Deadline: </span>
              <span>{formatAbsoluteDate(opportunity.application_deadline)}</span>
              <span className="text-xs text-muted-foreground">
                ({getDeadlineLabel(opportunity.application_deadline, now)})
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 text-slate-600">
          <MapPin
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-slate-400"
          />
          <div>
            <p>
              <span className="sr-only">Location: </span>
              {opportunity.location}
            </p>
          </div>
        </div>
        <div className="pl-6 text-xs leading-5 text-slate-500">
          Eligible years: {opportunity.eligible_years.join(", ")}
          {opportunity.eligible_branches.includes("*")
            ? " · All branches"
            : ` · ${opportunity.eligible_branches
                .map(formatLabel)
                .join(", ")}`}
        </div>
      </div>

      <div className="mt-auto border-t pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-500">
            <span
              className={
                verifiedIsOld
                  ? "font-semibold text-amber-800 dark:text-amber-300"
                  : ""
              }
              title={formatAbsoluteDate(opportunity.last_verified_at)}
            >
              Last verified {formatAbsoluteDate(opportunity.last_verified_at)}
              {verifiedIsOld && " · Older than 30 days"}
            </span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <TrackerAction
              opportunityId={opportunity.id}
              disabled={isClosed}
            />
            <a
              className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={opportunity.source_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Official source
              <ArrowUpRight aria-hidden="true" className="size-4" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
        </div>
        </div>
        <ReportOutdatedButton opportunity={opportunity} />
      </div>
    </article>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        className="mb-1.5 block text-xs font-semibold text-slate-600"
        htmlFor={id}
      >
        {label}
      </label>
      <select
        className="h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </div>
  );
}

function OpportunityFilterFields({
  filters,
  active,
  onChange,
  onClear,
  prefix
}: {
  filters: FeedFilters;
  active: boolean;
  onChange: (key: keyof FeedFilters, value: string) => void;
  onClear: () => void;
  prefix: string;
}) {
  return (
    <>
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <SlidersHorizontal aria-hidden="true" className="size-4 text-primary" />
        Find the right opportunity
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="sm:col-span-2 xl:col-span-2">
          <label
            className="mb-1.5 block text-xs font-semibold text-slate-600"
            htmlFor={`${prefix}-search`}
          >
            Search
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              autoComplete="off"
              className="h-11 w-full rounded-lg border bg-white pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              id={`${prefix}-search`}
              onChange={(event) => onChange("q", event.target.value)}
              placeholder="Title, organization, skill..."
              type="search"
              value={filters.q}
            />
          </div>
        </div>

        <FilterSelect
          id={`${prefix}-type`}
          label="Opportunity type"
          value={filters.type}
          onChange={(value) => onChange("type", value)}
        >
          <option value="">All types</option>
          {opportunityTypes.map((type) => (
            <option key={type} value={type}>
              {formatLabel(type)}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          id={`${prefix}-year`}
          label="Eligible year"
          value={filters.year}
          onChange={(value) => onChange("year", value)}
        >
          <option value="">All years</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              Year {year}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          id={`${prefix}-branch`}
          label="Branch"
          value={filters.branch}
          onChange={(value) => onChange("branch", value)}
        >
          <option value="">All branches</option>
          {branches.map((branch) => (
            <option key={branch} value={branch}>
              {formatLabel(branch)}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          id={`${prefix}-location`}
          label="Location"
          value={filters.location}
          onChange={(value) => onChange("location", value)}
        >
          <option value="">All locations</option>
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          id={`${prefix}-deadline`}
          label="Deadline within"
          value={filters.days}
          onChange={(value) => onChange("days", value)}
        >
          <option value="">Any deadline</option>
          {deadlineOptions.map((days) => (
            <option key={days} value={days}>
              {days} days
            </option>
          ))}
        </FilterSelect>

        <div className="flex items-end sm:col-span-2 lg:col-span-1">
          <button
            className="h-11 w-full rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!active}
            onClick={onClear}
            type="button"
          >
            Clear filters
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Filters are saved in the page URL, so you can bookmark or share your
        search.
      </p>
    </>
  );
}

function OpportunityCardsSkeleton() {
  return (
    <div
      aria-label="Loading opportunities"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
    >
      <span className="sr-only">Loading opportunities...</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div
          className="h-80 animate-pulse rounded-2xl border bg-white p-6"
          key={index}
        >
          <div className="h-6 w-24 rounded-full bg-slate-100" />
          <div className="mt-6 h-4 w-28 rounded bg-slate-100" />
          <div className="mt-3 h-6 w-4/5 rounded bg-slate-100" />
          <div className="mt-5 h-4 w-full rounded bg-slate-100" />
          <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />
          <div className="mt-9 h-4 w-2/3 rounded bg-slate-100" />
          <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function OpportunityFeedSkeleton() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-6 sm:px-8 sm:py-10">
      <div className="h-8 w-44 animate-pulse rounded bg-slate-200" />
      <div className="mt-14 h-10 max-w-xl animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-6 max-w-2xl animate-pulse rounded bg-slate-100" />
      <div className="mt-10 h-40 animate-pulse rounded-2xl bg-white" />
      <div className="mt-8">
        <OpportunityCardsSkeleton />
      </div>
    </main>
  );
}

export function OpportunityFeed() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const profile = useProfileStore((state) => state.profile);
  const asOf = new Date();
  const filters = getFilters(new URLSearchParams(searchParams.toString()));
  const matchingOpportunities = filterOpportunities(opportunities, filters);
  const filteredOpportunities =
    filters.sort === "recommended"
      ? [...matchingOpportunities].sort(
          (left, right) => {
            if (!profile) return 0;
            return (
              computeMatch(right, profile, asOf).score -
              computeMatch(left, profile, asOf).score
            );
          }
        )
      : filters.sort === "deadline"
        ? [...matchingOpportunities].sort(
            (left, right) =>
              Date.parse(left.application_deadline) -
              Date.parse(right.application_deadline)
          )
        : matchingOpportunities;
  const hasActiveFilters = filterKeys.some((key) => searchParams.has(key));

  function updateFilter(key: keyof FeedFilters, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.sort();
    const query = params.toString();

    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false
      });
    });
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    filterKeys.forEach((key) => params.delete(key));
    params.sort();
    const query = params.toString();

    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false
      });
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pb-24 pt-6 sm:px-8 sm:py-10 md:pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="flex items-center text-sm font-bold tracking-tight text-slate-950"
          href="/"
        >
          <span className="mr-2 inline-flex size-8 items-center justify-center rounded-xl bg-blue-700 text-white">
            IR
          </span>
          Internship Radar
        </Link>
        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-2">
          <Link
            className="rounded-full border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={profile ? "/profile" : "/onboarding"}
          >
            {profile ? "Your profile" : "Set up your profile"}
          </Link>
          <Link
            className="rounded-full bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="/tracker"
          >
            Tracker
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <section className="pb-8 pt-12 sm:pb-10 sm:pt-16">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
          Find your next opportunity
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Opportunities that move you forward.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Search internships, hackathons, research programs, scholarships, and
          competitions—all in one place.
        </p>
      </section>

      <section
        aria-label="Search and filter opportunities"
        className="hidden rounded-2xl border bg-white p-4 shadow-sm md:block sm:p-5"
      >
        <OpportunityFilterFields
          filters={filters}
          active={hasActiveFilters}
          onChange={updateFilter}
          onClear={clearFilters}
          prefix="desktop"
        />
      </section>
      <details className="group fixed bottom-3 left-3 right-3 z-40 md:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Filters
          {hasActiveFilters && (
            <span className="rounded-full bg-white px-2 py-0.5 text-xs text-primary">
              Active
            </span>
          )}
        </summary>
        <section
          aria-label="Search and filter opportunities"
          className="fixed bottom-[4.5rem] left-3 right-3 max-h-[75dvh] overflow-y-auto rounded-2xl border bg-white p-4 shadow-2xl"
        >
          <OpportunityFilterFields
            filters={filters}
            active={hasActiveFilters}
            onChange={updateFilter}
            onClear={clearFilters}
            prefix="mobile"
          />
        </section>
      </details>

      <section aria-labelledby="results-heading" className="pb-12 pt-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              className="text-xl font-semibold tracking-tight text-slate-950"
              id="results-heading"
            >
              Explore opportunities
            </h2>
            <p
              aria-live="polite"
              className="mt-1 text-sm text-slate-500"
              role="status"
            >
              {isPending
                ? "Updating results..."
                : `${filteredOpportunities.length} ${
                    filteredOpportunities.length === 1
                      ? "opportunity"
                      : "opportunities"
                  } found`}
            </p>
          </div>
          <div className="w-full sm:w-56">
            <label
              className="mb-1.5 block text-xs font-semibold text-slate-600"
              htmlFor="sort-opportunities"
            >
              Sort by
            </label>
            <select
              className="h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              id="sort-opportunities"
              onChange={(event) => updateFilter("sort", event.target.value)}
              value={filters.sort}
            >
              <option value="">Default order</option>
              <option value="recommended">Recommended for you</option>
              <option value="deadline">Deadline (soonest)</option>
            </select>
          </div>
        </div>

        {isPending ? (
          <OpportunityCardsSkeleton />
        ) : filteredOpportunities.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredOpportunities.map((opportunity) =>
              profile ? (
                <MatchCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  profile={profile}
                  asOf={asOf}
                />
              ) : (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              )
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-white px-6 py-14 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100">
              <Search
                aria-hidden="true"
                className="size-5 text-slate-500"
              />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">
              No opportunities found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Try a different search or loosen your filters to see more
              opportunities.
            </p>
            {!profile && (
              <p className="mt-2 text-sm text-slate-600">
                Add your profile to see personalized recommendations.
              </p>
            )}
            <button
              className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={clearFilters}
              type="button"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

    </main>
  );
}
