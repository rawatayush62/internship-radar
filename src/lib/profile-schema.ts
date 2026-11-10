import { z } from "zod";
import {
  SKILLS_TAXONOMY
} from "./skills";
import type {
  OpportunityType,
  Profile,
  SkillLevel
} from "@/types/opportunity";

const interestTypes = [
  "internship",
  "hackathon",
  "research",
  "scholarship",
  "competition"
] as const satisfies readonly OpportunityType[];

const skillIds = SKILLS_TAXONOMY.map((skill) => skill.id) as [
  string,
  ...string[]
];

const profileSkillSchema = z.object({
  id: z.enum(skillIds, { error: "Choose a skill from the suggestions." }),
  level: z.enum(["beginner", "intermediate", "advanced"], {
    error: "Choose a skill level."
  })
});

const projectSchema = z.object({
  title: z.string().trim().min(1, "Enter a project title.").max(100),
  tech_used: z
    .string()
    .max(250, "Keep the technology list under 250 characters.")
    .transform((value) =>
      value
        .split(",")
        .map((technology) => technology.trim())
        .filter(Boolean)
    )
});

export const profileSchema = z.object({
  academic_year: z
    .number()
    .int("Choose your year of study.")
    .min(1, "Choose a year from 1 to 4.")
    .max(4, "Choose a year from 1 to 4.")
    .transform((year) => year as Profile["academic_year"]),
  branch: z.string().trim().min(1, "Choose your branch."),
  preferred_locations: z.array(z.string().trim().min(1)).max(12),
  remote_is_fine: z.boolean(),
  opportunity_types: z
    .array(z.enum(interestTypes))
    .min(1, "Choose at least one opportunity type."),
  skills: z.array(profileSkillSchema),
  projects: z.array(projectSchema).max(10, "Add up to 10 projects."),
  interests: z
    .array(z.string().trim().min(1))
    .max(20, "Add up to 20 interest tags.")
})
  .superRefine((profile, context) => {
    const skillIdsSeen = new Set<string>();
    profile.skills.forEach((skill, index) => {
      if (skillIdsSeen.has(skill.id)) {
        context.addIssue({
          code: "custom",
          message: "Each skill can only be added once.",
          path: ["skills", index, "id"]
        });
      }
      skillIdsSeen.add(skill.id);
    });

    const projectTitles = new Set<string>();
    profile.projects.forEach((project, index) => {
      const title = project.title.toLocaleLowerCase();
      if (projectTitles.has(title)) {
        context.addIssue({
          code: "custom",
          message: "Project titles must be unique.",
          path: ["projects", index, "title"]
        });
      }
      projectTitles.add(title);
    });
  })
  .transform((profile): Profile => ({
    ...profile,
    skills: profile.skills.map((skill) => ({
      id: skill.id,
      level: skill.level as SkillLevel
    }))
  }));

export type ProfileFormInput = z.input<typeof profileSchema>;
export type ProfileFormOutput = z.output<typeof profileSchema>;

export const PROFILE_INTEREST_TYPES = interestTypes;
