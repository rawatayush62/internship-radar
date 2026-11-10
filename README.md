# Internship Radar

A frontend-only opportunity discovery app built with Next.js App Router,
TypeScript, Tailwind CSS, and shadcn/ui configuration. Opportunity records are
static JSON fixtures; no backend or client API keys are used.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Step 1 scaffold

- Opportunity and student profile types live in `src/types/opportunity.ts`.
- Canonical skill IDs and their aliases live in `src/lib/skills.ts`.
- The 15 sample records are in `data/opportunities.json`.
- The source links point to organization pages. Deadlines and
  `last_verified_at` values in this starter data are illustrative fixtures,
  not confirmation of a current application cycle; check the linked source
  before acting on them.

`components.json` and the Tailwind theme tokens are set up for shadcn/ui
components.

## Opportunity feed

The feed at `/` includes text search and filters for opportunity type, eligible
year, branch, location, and deadlines within 7, 14, 30, 60, or 90 days. Filter
values are encoded in query parameters (`q`, `type`, `year`, `branch`,
`location`, `days`, and `sort`) so searches can be bookmarked and shared. Its
recommended sort uses the saved profile's interests, eligibility, location
preferences, and skills as ordering signals; it is not a hiring-probability
estimate. Each card links to the official source and displays its last
verification date.

## Profile onboarding

- `/onboarding` and `/profile` share a four-step, Zod-validated React Hook Form.
- The profile is saved locally through Zustand persist under the
  `internship-radar-profile` localStorage key.
- Skill search accepts taxonomy aliases and records a beginner, intermediate,
  or advanced level for each selected skill. An optional PDF resume reader
  extracts selectable text in the browser and suggests matching taxonomy
  skills. Files and extracted text are not uploaded or persisted; scanned
  image-only PDFs are not OCR-processed.
- Saving a profile redirects to `/?sort=recommended`. Use the profile editor to
  update it later.

The `Profile` interface keeps its original `academic_year`, `branch`, and
`opportunity_types` fields. Its `skills` field now stores `{ id, level }`
entries instead of strings, and it adds preferred locations, a remote-work
preference, projects, and interest tags.

## Profile matching

`computeMatch(opportunity, profile, asOf)` is a pure function. It gates the
compatibility score on year, branch, selected opportunity type, and an
unexpired, valid deadline, then scores canonical skill overlap: required skills
contribute 70% and preferred skills 30% (normalized when one category is
absent). It returns the score, matched and missing skill IDs, and each
eligibility flag. Run its unit tests with `npm test`.

Match Cards show matched skills, skills to improve, the recommendation and
eligibility checks, plus deadline, source, and verification date. Scores are
labeled **“Profile compatibility score, not a verified hiring probability.”**

## Skill roadmaps and application tracker

- Match Cards link missing skills to a generated 2–4 week learning and project
  roadmap at `/roadmap`. Project ideas and learning resources come from a
  static skill map; unknown/custom IDs receive a clearly generic starter idea.
- Save opportunities to the Kanban tracker at `/tracker`. Move cards between
  Saved, Applied, Interview, Offer, and Rejected by dragging them or using the
  accessible status menu.
- Tracker records are stored in localStorage under
  `internship-radar-tracker`. Countdown badges are calculated from each
  opportunity's static deadline.
- Run unit tests with `npm test`.

## Trust, appearance, and data controls

- The theme toggle follows the system preference by default and stores an
  explicit light or dark choice locally.
- Opportunity cards distinguish closing-soon and closed listings, show exact
  deadline and verification dates, and provide a prefilled email report link.
  Listings remain static fixtures and should be confirmed at their source.
- The feed filters are available in a mobile bottom sheet; tracker stages use
  a mobile tab view and support keyboard movement as well as drag and drop.
- `/profile` can export the local profile as JSON or reset profile and tracker
  data. Nothing is sent to a backend.
- Route metadata, an Open Graph image, and an SVG favicon are included.
  Set `SITE_URL` to the deployed origin when building for production so shared
  image URLs resolve correctly.
