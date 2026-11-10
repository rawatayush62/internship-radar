import { KanbanTracker } from "@/components/tracker/kanban-tracker";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opportunity Tracker | Internship Radar",
  description:
    "Track saved opportunities and applications through your personal pipeline."
};

export default function TrackerPage() {
  return (
    <main className="mx-auto min-h-screen max-w-[90rem] px-5 py-6 sm:px-8 sm:py-10">
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
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            className="text-sm font-semibold text-primary hover:underline"
            href="/roadmap"
          >
            Skill roadmap
          </Link>
          <Link
            className="text-sm font-semibold text-primary hover:underline"
            href="/"
          >
            Browse opportunities
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="pb-8 pt-12 sm:pb-10 sm:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
          Your application journey
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Opportunity tracker
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Save opportunities, move them through your application pipeline, and
          keep an eye on approaching deadlines. Changes are saved on this device.
        </p>
      </section>

      <KanbanTracker />
    </main>
  );
}
