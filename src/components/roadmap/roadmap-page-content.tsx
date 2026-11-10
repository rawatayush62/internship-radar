"use client";

import { ArrowLeft, BookOpen, ExternalLink, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import opportunityData from "../../../data/opportunities.json";
import { generateSkillRoadmap } from "@/lib/skill-roadmap";
import { SKILLS_TAXONOMY } from "@/lib/skills";
import type { Opportunity } from "@/types/opportunity";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const opportunities = opportunityData as Opportunity[];

export function RoadmapPageContent() {
  const searchParams = useSearchParams();
  const skillIds = searchParams
    .getAll("skills")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  const roadmap = generateSkillRoadmap(skillIds);
  const opportunity = opportunities.find(
    (item) => item.id === searchParams.get("opportunity")
  );
  const labels = new Map(
    SKILLS_TAXONOMY.map((skill) => [skill.id, skill.label])
  );

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-6 sm:px-8 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <Link
          className="flex items-center text-sm font-bold tracking-tight text-slate-950"
          href="/"
        >
          <span className="mr-2 inline-flex size-8 items-center justify-center rounded-xl bg-blue-700 text-white">
            IR
          </span>
          Internship Radar
        </Link>
        <div className="flex items-center gap-3">
          <Link
            className="text-sm font-semibold text-primary hover:underline"
            href="/tracker"
          >
            Tracker
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="pb-8 pt-12 sm:pt-16">
        <Link
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/?sort=recommended"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to opportunities
        </Link>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
          Skill-gap roadmap
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          A practical plan to build your skills.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          A suggested learning and project plan, not a guarantee of
          qualification. Set aside a few focused hours each week and adapt it
          to your schedule.
        </p>
        {opportunity && (
          <p className="mt-3 text-sm text-slate-600">
            Prepared for{" "}
            <span className="font-semibold text-slate-900">
              {opportunity.title}
            </span>{" "}
at {opportunity.organization}.
          </p>
        )}
      </section>

      {roadmap.length > 0 ? (
        <section aria-label="Skill improvement plan" className="space-y-4 pb-12">
          {roadmap.map((week) => (
            <article
              className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6"
              key={week.week}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-4">
                <h2 className="text-lg font-semibold text-slate-950">
                  Week {week.week}
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  {week.focus}
                </p>
              </div>
              <ul className="mt-4 space-y-4">
                {week.tasks.map((task) => (
                  <li
                    className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"
                    key={`${task.skillId}-${task.activity}`}
                  >
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                        {task.activity === "learn" ? (
                          <BookOpen aria-hidden="true" className="size-4 text-primary" />
                        ) : (
                          <Lightbulb aria-hidden="true" className="size-4 text-amber-600" />
                        )}
                        {labels.get(task.skillId) ?? task.skillId}
                      </p>
                      {task.activity === "learn" ? (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Study the core concepts, then write down three ideas
                          you want to apply.
                        </p>
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {task.projectIdea}
                        </p>
                      )}
                    </div>
                    <div className="rounded-xl border p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {task.activity === "learn"
                          ? "Learning resource"
                          : "Project practice"}
                      </p>
                      {task.activity === "learn" ? (
                        <a
                          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          href={task.learningResource.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {task.learningResource.label}
                          <ExternalLink aria-hidden="true" className="size-3.5" />
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          Finish with a small demo, README, and a short note on
                          what you learned.
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
          <p className="rounded-xl border border-dashed px-4 py-4 text-sm leading-6 text-slate-600">
            Learning resource links open external sites. Review their current
            terms and content before use.
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            No skill gaps to plan yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Open a Match Card and choose “Build a skill roadmap” to create a
            focused plan for its missing skills.
          </p>
          <Link
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href="/?sort=recommended"
          >
            Browse matches
          </Link>
        </section>
      )}
    </main>
  );
}
