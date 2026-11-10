import { Suspense } from "react";
import { OpportunityFeed, OpportunityFeedSkeleton } from "./opportunity-feed";

export default function HomePage() {
  return (
    <Suspense fallback={<OpportunityFeedSkeleton />}>
      <OpportunityFeed />
    </Suspense>
  );
}
