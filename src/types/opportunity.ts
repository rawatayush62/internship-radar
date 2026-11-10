export type AcademicYear = 1 | 2 | 3 | 4 | 5;
export type ProfileAcademicYear = 1 | 2 | 3 | 4;
export type SkillLevel = "beginner" | "intermediate" | "advanced";

export type OpportunityType =
  | "internship"
  | "hackathon"
  | "research"
  | "scholarship"
  | "competition"
  | "open_source";

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: OpportunityType;
  description: string;
  location: string;
  remote: boolean;
  application_deadline: string;
  eligible_years: AcademicYear[];
  eligible_branches: string[];
  required_skills: string[];
  preferred_skills: string[];
  source_url: string;
  last_verified_at: string;
}

export interface Profile {
  academic_year: ProfileAcademicYear;
  branch: string;
  preferred_locations: string[];
  remote_is_fine: boolean;
  skills: ProfileSkill[];
  projects: ProfileProject[];
  interests: string[];
  opportunity_types: OpportunityType[];
}

export interface ProfileSkill {
  id: string;
  level: SkillLevel;
}

export interface ProfileProject {
  title: string;
  tech_used: string[];
}
