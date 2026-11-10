"use client";

import { Flag } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";

export function ReportOutdatedButton({
  opportunity
}: {
  opportunity: Opportunity;
}) {
  const subject = encodeURIComponent(
    `Outdated listing: ${opportunity.title} (${opportunity.id})`
  );
  const body = encodeURIComponent(
    `Please review this listing.\n\nOpportunity ID: ${opportunity.id}\nTitle: ${opportunity.title}\nSource URL: ${opportunity.source_url}\nLast verified: ${opportunity.last_verified_at}\n\nWhat appears outdated? `
  );
  const href = `mailto:?subject=${subject}&body=${body}`;

  return (
    <a
      aria-label={`Report outdated listing: ${opportunity.title}`}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={href}
    >
      <Flag aria-hidden="true" className="size-3.5" />
      Report outdated listing
    </a>
  );
}
