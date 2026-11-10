import { describe, expect, it } from "vitest";
import { computeMatch } from "./compute-match";
import { getCanonicalSkillId } from "./skills";
import type { Opportunity, Profile } from "@/types/opportunity";

const asOf = new Date("2026-11-10T12:00:00.000Z");

const opportunity: Opportunity = {
  id: "first-year-software-internship",
  title: "First-year Software Internship",
  organization: "Example Labs",
  type: "internship",
  description: "An introductory software internship.",
  location: "Remote",
  remote: true,
  application_deadline: "2026-12-15",
  eligible_years: [1, 2],
  eligible_branches: ["computer science", "computer engineering"],
  required_skills: ["cpp", "html-css", "javascript", "python"],
  preferred_skills: ["git", "data-structures"],
  source_url: "https://example.com/opportunities/software-internship",
  last_verified_at: "2026-11-10"
};

const firstYearProfile: Profile = {
  academic_year: 1,
  branch: "Computer Science",
  preferred_locations: [],
  remote_is_fine: true,
  opportunity_types: ["internship"],
  skills: [
    { id: "cpp", level: "beginner" },
    { id: "html-css", level: "beginner" },
    { id: "javascript", level: "beginner" },
    { id: "python", level: "beginner" }
  ],
  projects: [],
  interests: []
};

describe("computeMatch", () => {
  it("scores a first-year beginner profile with 70% required-skill overlap", () => {
    const result = computeMatch(opportunity, firstYearProfile, asOf);

    expect(result.score).toBe(70);
    expect(result.matchedSkills).toEqual([
      "cpp",
      "html-css",
      "javascript",
      "python"
    ]);
    expect(result.missingSkills).toEqual(["git", "data-structures"]);
    expect(result.eligibility).toEqual({
      year: true,
      branch: true,
      type: true,
      deadline: true,
      eligible: true
    });
  });

  it("recognizes skill aliases and combines required and preferred overlap", () => {
    expect(getCanonicalSkillId("C")).toBe("c");
    expect(getCanonicalSkillId("C++")).toBe("cpp");
    const profile: Profile = {
      ...firstYearProfile,
      academic_year: 2,
      branch: "Computer Engineering",
      skills: [
        { id: "C++", level: "advanced" },
        { id: "HTML CSS", level: "intermediate" },
        { id: "JavaScript", level: "advanced" },
        { id: "Python3", level: "intermediate" },
        { id: "version control", level: "beginner" },
        { id: "DSA", level: "beginner" }
      ]
    };

    const result = computeMatch(opportunity, profile, asOf);

    expect(result.score).toBe(100);
    expect(result.missingSkills).toEqual([]);
    expect(result.eligibility.eligible).toBe(true);
  });

  it("blocks an ineligible profile and expired opportunities", () => {
    const profile: Profile = {
      ...firstYearProfile,
      academic_year: 4,
      branch: "Biology",
      opportunity_types: ["research"]
    };
    const expiredOpportunity = {
      ...opportunity,
      application_deadline: "2026-11-09"
    };

    const result = computeMatch(expiredOpportunity, profile, asOf);

    expect(result.score).toBe(0);
    expect(result.eligibility).toEqual({
      year: false,
      branch: false,
      type: false,
      deadline: false,
      eligible: false
    });

    expect(
      computeMatch(
        { ...opportunity, application_deadline: "2026-02-31" },
        firstYearProfile,
        asOf
      ).eligibility.deadline
    ).toBe(false);
  });
});
