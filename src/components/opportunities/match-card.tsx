"use client";

import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { computeMatch } from "@/lib/compute-match";
import { TrackerAction } from "@/components/tracker/tracker-action";
import { ReportOutdatedButton } from "@/components/opportunities/report-outdated-button";
import {
  formatAbsoluteDate,
  getDeadlineLabel,
  getDaysUntilDeadline,
  isOpportunityClosed,
  isVerifiedOlderThan30Days
} from "@/lib/opportunity-display";
import { SKILLS_TAXONOMY } from "@/lib/skills";
import type { Opportunity, Profile } from "@/types/opportunity";

function formatLabel(value: string) {
  if (value === "open_source") return "Open source";
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function skillLabel(id: string) {
  return (
    SKILLS_TAXONOMY.find((skill) => skill.id === id)?.label ??
    formatLabel(id.replace(/-/g, " "))
  );
}

function recommendationText(
  eligible: boolean,
  score: number,
  missingSkills: string[]
) {
  if (!eligible) {
    return "One or more profile eligibility filters do not match. Review the details before applying.";
  }
  if (score === 100) {
    return "Your profile covers all listed skills and passes the eligibility filters.";
  }
  if (missingSkills.length > 0) {
    return `You pass the eligibility filters. Explore this opportunity and consider building ${missingSkills
      .slice(0, 2)
      .map(skillLabel)
      .join(" and ")}.`;
  }
  return "Your profile passes the listed eligibility filters.";
}

function ScoreRing({ score }: { score: number }) {
  const radius = 21;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <svg
        aria-label="Profile compatibility score"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={score}
        aria-valuetext={`${score} percent profile compatibility`}
        className="size-12 shrink-0 -rotate-90 sm:size-14"
        role="meter"
        viewBox="0 0 52 52"
      >
        <circle
          className="fill-none stroke-slate-100"
          cx="26"
          cy="26"
          r={radius}
          strokeWidth="5"
        />
        <circle
          className={`fill-none transition-[stroke-dashoffset] ${
            score >= 70 ? "stroke-emerald-500" : score >= 40 ? "stroke-amber-500" : "stroke-slate-400"
          }`}
          cx="26"
          cy="26"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="5"
        />
        <text
          className="fill-slate-900 text-[11px] font-bold"
          dominantBaseline="central"
          textAnchor="middle"
          transform="rotate(90 26 26)"
          x="26"
          y="26"
        >
          {score}
        </text>
      </svg>
      <div>
        <p className="max-w-56 text-[11px] font-semibold leading-4 text-slate-800 sm:text-xs">
          Profile compatibility score,
          <br />
          not a verified hiring probability
        </p>
        <p className="mt-1 text-[11px] text-slate-500">Based on your profile</p>
      </div>
    </div>
  );
}

function SkillChips({
  title,
  skills,
  tone
}: {
  title: string;
  skills: string[];
  tone: "matched" | "missing";
}) {
  if (skills.length === 0) return null;

  const colors =
    tone === "matched"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : "bg-amber-50 text-amber-900 ring-amber-200";

  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-700">{title}</h3>
      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={title}>
        {skills.map((skill) => (
          <li
            className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${colors}`}
            key={skill}
          >
            {skillLabel(skill)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EligibilitySummary({
  flags
}: {
  flags: {
    year: boolean;
    branch: boolean;
    type: boolean;
    deadline: boolean;
  };
}) {
  const checks = [
    ["Year", flags.year],
    ["Branch", flags.branch],
    ["Type", flags.type],
    ["Deadline", flags.deadline]
  ] as const;

  return (
    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Profile eligibility checks">
      {checks.map(([label, passes]) => (
        <li
          className={`rounded-full px-2 py-1 text-[11px] font-medium ${
            passes
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-800"
          }`}
          key={label}
        >
          {label}: {passes ? "matches" : "check"}
        </li>
      ))}
    </ul>
  );
}

export function MatchCard({
  opportunity,
  profile,
  asOf
}: {
  opportunity: Opportunity;
  profile: Profile;
  asOf: Date;
}) {
  const match = computeMatch(opportunity, profile, asOf);
  const isClosed = isOpportunityClosed(opportunity, asOf);
  const daysUntilDeadline = getDaysUntilDeadline(
    opportunity.application_deadline,
    asOf
  );
  const verifiedIsOld = isVerifiedOlderThan30Days(
    opportunity.last_verified_at,
    asOf
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
          {daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= 7 && (
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

      <div className="mt-5 border-t pt-4">
        <ScoreRing score={match.score} />
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm leading-5 ${
            match.eligibility.eligible
              ? "bg-blue-50 text-blue-900"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {recommendationText(
            match.eligibility.eligible,
            match.score,
            match.missingSkills
          )}
        </p>
        <EligibilitySummary flags={match.eligibility} />
      </div>

      <div className="mt-4 space-y-3">
        <SkillChips
          title="Matched skills"
          skills={match.matchedSkills}
          tone="matched"
        />
        <SkillChips
          title="Skills to improve"
          skills={match.missingSkills}
          tone="missing"
        />
        {match.matchedSkills.length === 0 && match.missingSkills.length === 0 && (
          <p className="text-xs text-slate-500">
            No skills are listed for this opportunity.
          </p>
        )}
      </div>
      {match.missingSkills.length > 0 && (
        <Link
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href={`/roadmap?skills=${encodeURIComponent(
            match.missingSkills.join(",")
          )}&opportunity=${encodeURIComponent(opportunity.id)}`}
        >
          Build a {Math.min(4, Math.max(2, Math.ceil(match.missingSkills.length / 2) + 1))}-week skill roadmap
        </Link>
      )}

      <dl className="mt-5 grid gap-3 border-t pt-4 text-sm">
        <div className="flex items-start gap-2.5 text-slate-600">
          <CalendarDays
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-slate-400"
          />
          <div>
            <dt className="sr-only">Deadline</dt>
            <dd
              className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1"
              title={formatAbsoluteDate(opportunity.application_deadline)}
            >
              <span>{formatAbsoluteDate(opportunity.application_deadline)}</span>
              <span className="text-xs text-muted-foreground">
                ({getDeadlineLabel(opportunity.application_deadline, asOf)})
              </span>
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5 text-slate-600">
          <MapPin
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-slate-400"
          />
          <div>
            <dt className="sr-only">Location</dt>
            <dd>{opportunity.location}</dd>
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
      </dl>

      <div className="mt-auto border-t pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`text-xs ${
              verifiedIsOld
                ? "font-semibold text-amber-800 dark:text-amber-300"
                : "text-slate-500"
            }`}
            title={formatAbsoluteDate(opportunity.last_verified_at)}
          >
            Last verified {formatAbsoluteDate(opportunity.last_verified_at)}
            {verifiedIsOld && " · Older than 30 days"}
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
