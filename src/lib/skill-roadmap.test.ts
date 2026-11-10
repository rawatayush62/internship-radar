import { describe, expect, it } from "vitest";
import { generateSkillRoadmap } from "./skill-roadmap";
import { SKILLS_TAXONOMY } from "./skills";

describe("generateSkillRoadmap", () => {
  it("creates a two-week plan for one or two skills", () => {
    const roadmap = generateSkillRoadmap(["ReactJS"]);

    expect(roadmap).toHaveLength(2);
    expect(roadmap[0].tasks[0]).toMatchObject({
      skillId: "react",
      learningResource: { url: "https://react.dev/learn" }
    });
    expect(roadmap.every((week) => week.tasks.length > 0)).toBe(true);
    expect(roadmap.flatMap((week) => week.tasks)).toHaveLength(2);
  });

  it("scales to four weeks, deduplicates aliases, and includes a project for each skill", () => {
    const roadmap = generateSkillRoadmap([
      "React",
      "ReactJS",
      "Python",
      "C++",
      "SQL",
      "Git",
      "Robotics"
    ]);

    expect(roadmap).toHaveLength(4);
    expect(roadmap.every((week) => week.tasks.length > 0)).toBe(true);
    expect(roadmap.flatMap((week) => week.tasks)).toHaveLength(12);
    expect(
      roadmap.every((week) =>
        week.tasks.every(
          (task) => task.projectIdea.length > 0 && task.learningResource.url.startsWith("https://")
        )
      )
    ).toBe(true);
  });

  it("provides a project idea and learning resource for every taxonomy skill", () => {
    const roadmap = generateSkillRoadmap(
      SKILLS_TAXONOMY.map((skill) => skill.id)
    );
    const tasks = roadmap.flatMap((week) => week.tasks);
    const plannedSkills = new Set(tasks.map((task) => task.skillId));

    expect(roadmap).toHaveLength(4);
    expect(SKILLS_TAXONOMY.every((skill) => plannedSkills.has(skill.id))).toBe(
      true
    );
    expect(
      tasks.every(
        (task) => task.projectIdea && task.learningResource.url.startsWith("https://")
      )
    ).toBe(true);
  });
});
