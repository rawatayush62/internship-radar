import { Suspense } from "react";
import { RoadmapPageContent } from "@/components/roadmap/roadmap-page-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skill Roadmap | Internship Radar",
  description:
    "Explore a practical, personalized learning and project roadmap for opportunity skill gaps."
};

function RoadmapLoading() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-10 sm:px-8">
      <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-10 h-40 animate-pulse rounded-2xl bg-white" />
    </main>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense fallback={<RoadmapLoading />}>
      <RoadmapPageContent />
    </Suspense>
  );
}
