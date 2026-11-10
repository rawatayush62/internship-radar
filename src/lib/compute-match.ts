import { getCanonicalSkillId } from "./skills";
import type {
  Opportunity,
  Profile,
  ProfileSkill
} from "@/types/opportunity";

export interface EligibilityFlags {
  year: boolean;
  branch: boolean;
  type: boolean;
  deadline: boolean;
  eligible: boolean;
}

export interface MatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  eligibility: EligibilityFlags;
}

function isBranchEligible(opportunity: Opportunity, branch: string) {
  const normalizedBranch = branch.trim().toLocaleLowerCase();
  return opportunity.eligible_branches.some((eligibleBranch) => {
    const normalizedEligibleBranch = eligibleBranch.trim().toLocaleLowerCase();
    return (
      normalizedEligibleBranch === "*" ||
      normalizedEligibleBranch === "related" ||
      normalizedEligibleBranch === normalizedBranch
    );
  });
}

function deadlineHasNotPassed(deadline: string, asOf: Date) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(deadline);
  if (!parts || !Number.isFinite(asOf.getTime())) {
    return false;
  }
  const [, yearText, monthText, dayText] = parts;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const deadlineDate = new Date(Date.UTC(year, month - 1, day));
  if (
    deadlineDate.getUTCFullYear() !== year ||
    deadlineDate.getUTCMonth() !== month - 1 ||
    deadlineDate.getUTCDate() !== day
  ) {
    return false;
  }
  const deadlineTime = deadlineDate.getTime();
  const asOfDay = Date.UTC(
    asOf.getUTCFullYear(),
    asOf.getUTCMonth(),
    asOf.getUTCDate()
  );
  return deadlineTime >= asOfDay;
}

function canonicalizeSkills(skills: string[] | ProfileSkill[]) {
  return new Set(
    skills
      .map((skill) =>
        typeof skill === "string" ? skill : skill.id
      )
      .map((skill) => getCanonicalSkillId(skill) ?? skill)
  );
}

export function computeMatch(
  opportunity: Opportunity,
  profile: Profile,
  asOf: Date
): MatchResult {
  const eligibility: EligibilityFlags = {
    year: opportunity.eligible_years.includes(profile.academic_year),
    branch: isBranchEligible(opportunity, profile.branch),
    type: profile.opportunity_types.includes(opportunity.type),
    deadline: deadlineHasNotPassed(opportunity.application_deadline, asOf),
    eligible: false
  };
  eligibility.eligible =
    eligibility.year &&
    eligibility.branch &&
    eligibility.type &&
    eligibility.deadline;

  const profileSkills = canonicalizeSkills(profile.skills);
  const requiredSkills = opportunity.required_skills.map(
    (skill) => getCanonicalSkillId(skill) ?? skill
  );
  const preferredSkills = opportunity.preferred_skills.map(
    (skill) => getCanonicalSkillId(skill) ?? skill
  );
  const allOpportunitySkills = [...new Set([...requiredSkills, ...preferredSkills])];
  const matchedSkills = allOpportunitySkills.filter((skill) =>
    profileSkills.has(skill)
  );
  const missingSkills = allOpportunitySkills.filter(
    (skill) => !profileSkills.has(skill)
  );
  const requiredOverlap =
    requiredSkills.length === 0
      ? null
      : requiredSkills.filter((skill) => profileSkills.has(skill)).length /
        requiredSkills.length;
  const preferredOverlap =
    preferredSkills.length === 0
      ? null
      : preferredSkills.filter((skill) => profileSkills.has(skill)).length /
        preferredSkills.length;
  const availableWeight =
    (requiredOverlap === null ? 0 : 70) +
    (preferredOverlap === null ? 0 : 30);
  const weightedOverlap =
    availableWeight === 0
      ? 0
      : ((requiredOverlap ?? 0) * 70 +
          (preferredOverlap ?? 0) * 30) /
        availableWeight;

  return {
    score: eligibility.eligible ? Math.round(weightedOverlap * 100) : 0,
    matchedSkills,
    missingSkills,
    eligibility
  };
}
