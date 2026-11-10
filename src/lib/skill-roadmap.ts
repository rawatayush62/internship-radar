import { getCanonicalSkillId } from "./skills";

export interface SkillLearningResource {
  label: string;
  url: string;
}

export interface SkillRoadmapResource {
  skillId: string;
  projectIdea: string;
  learningResource: SkillLearningResource;
}

export interface SkillRoadmapWeek {
  week: number;
  focus: string;
  tasks: (SkillRoadmapResource & { activity: "learn" | "build" })[];
}

const SKILL_PROJECT_RESOURCES: Record<string, Omit<SkillRoadmapResource, "skillId">> = {
  algorithms: {
    projectIdea: "Implement and compare two search or sorting algorithms with a small visual demo.",
    learningResource: { label: "VisuAlgo", url: "https://visualgo.net/en" }
  },
  c: {
    projectIdea: "Build a command-line utility that parses a text file and reports useful statistics.",
    learningResource: { label: "Learn C", url: "https://www.learn-c.org/" }
  },
  cpp: {
    projectIdea: "Create a command-line task manager using structs, vectors, and file persistence.",
    learningResource: { label: "Learn C++", url: "https://www.learncpp.com/" }
  },
  "data-structures": {
    projectIdea: "Build a visualizer for a stack, queue, and binary search tree.",
    learningResource: { label: "VisuAlgo", url: "https://visualgo.net/en" }
  },
  "html-css": {
    projectIdea: "Create a responsive, accessible portfolio page with a project gallery.",
    learningResource: { label: "MDN HTML and CSS", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development" }
  },
  javascript: {
    projectIdea: "Build an interactive browser app that searches and filters a local dataset.",
    learningResource: { label: "JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide" }
  },
  python: {
    projectIdea: "Write a Python script that reads a CSV and produces a summary report.",
    learningResource: { label: "Python for Everybody", url: "https://www.py4e.com/lessons" }
  },
  react: {
    projectIdea: "Build a small dashboard with reusable components and accessible form controls.",
    learningResource: { label: "React Learn", url: "https://react.dev/learn" }
  },
  typescript: {
    projectIdea: "Add typed models and input validation to a small browser app.",
    learningResource: { label: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html" }
  },
  git: {
    projectIdea: "Publish a small project with a clean commit history, branches, and a contribution guide.",
    learningResource: { label: "Pro Git", url: "https://git-scm.com/book/en/v2" }
  },
  sql: {
    projectIdea: "Design a small relational schema and write queries for a sample library dataset.",
    learningResource: { label: "SQLBolt", url: "https://sqlbolt.com/" }
  },
  "machine-learning": {
    projectIdea: "Train and evaluate a simple classifier on a public, beginner-friendly dataset.",
    learningResource: { label: "Google Machine Learning Crash Course", url: "https://developers.google.com/machine-learning/crash-course" }
  },
  pandas: {
    projectIdea: "Clean a public CSV dataset and publish a short exploratory analysis.",
    learningResource: { label: "Pandas Getting Started", url: "https://pandas.pydata.org/docs/getting_started/intro_tutorials/" }
  },
  pytorch: {
    projectIdea: "Train a small neural network on a tutorial dataset and document its evaluation.",
    learningResource: { label: "PyTorch Tutorials", url: "https://pytorch.org/tutorials/" }
  },
  tensorflow: {
    projectIdea: "Train a small image or text classifier and explain its limitations.",
    learningResource: { label: "TensorFlow Tutorials", url: "https://www.tensorflow.org/tutorials" }
  },
  docker: {
    projectIdea: "Containerize a small app and document a reproducible local run workflow.",
    learningResource: { label: "Docker Get Started", url: "https://docs.docker.com/get-started/" }
  },
  cybersecurity: {
    projectIdea: "Create a local security checklist and threat model for a demo application.",
    learningResource: { label: "OWASP Top 10", url: "https://owasp.org/www-project-top-ten/" }
  },
  "ui-ux": {
    projectIdea: "Redesign a common student task and document a simple, accessible user flow.",
    learningResource: { label: "Laws of UX", url: "https://lawsofux.com/" }
  },
  figma: {
    projectIdea: "Prototype a mobile-first opportunity discovery flow with reusable components.",
    learningResource: { label: "Figma Learn", url: "https://help.figma.com/hc/en-us/categories/360002051613-Learn-design" }
  },
  linux: {
    projectIdea: "Write a shell script that organizes sample files and records a clear usage guide.",
    learningResource: { label: "The Linux Command Line", url: "https://linuxcommand.org/tlcl.php" }
  },
  java: {
    projectIdea: "Build a command-line study planner with classes, collections, and unit tests.",
    learningResource: { label: "Dev.java Learn", url: "https://dev.java/learn/" }
  },
  nodejs: {
    projectIdea: "Create a small command-line tool that reads JSON and prints a useful summary.",
    learningResource: { label: "Node.js Learn", url: "https://nodejs.org/en/learn" }
  },
  nextjs: {
    projectIdea: "Build a static multi-page directory with accessible navigation and filters.",
    learningResource: { label: "Next.js Learn", url: "https://nextjs.org/learn" }
  },
  cloud: {
    projectIdea: "Draw and document a simple cloud deployment architecture for a static app.",
    learningResource: { label: "AWS Cloud Practitioner Essentials", url: "https://skillbuilder.aws/learn" }
  },
  statistics: {
    projectIdea: "Analyze a public dataset and explain its distributions and uncertainty.",
    learningResource: { label: "Khan Academy Statistics", url: "https://www.khanacademy.org/math/statistics-probability" }
  },
  "data-analysis": {
    projectIdea: "Explore a public dataset and present three findings with clear charts.",
    learningResource: { label: "Kaggle Learn: Data Visualization", url: "https://www.kaggle.com/learn/data-visualization" }
  },
  communication: {
    projectIdea: "Present a five-minute demo of a project to a classmate and revise it using their feedback.",
    learningResource: { label: "Purdue OWL: Oral Presentations", url: "https://owl.purdue.edu/owl/general_writing/academic_writing/visual_rhetoric/index.html" }
  },
  electronics: {
    projectIdea: "Prototype a simple sensor circuit and document its wiring and observed behavior.",
    learningResource: { label: "Adafruit Learning System", url: "https://learn.adafruit.com/" }
  },
  cad: {
    projectIdea: "Model a small everyday object and prepare a drawing with dimensions.",
    learningResource: { label: "Onshape Learning Center", url: "https://learn.onshape.com/" }
  },
  "deep-learning": {
    projectIdea: "Train a small neural network and compare its performance with a simple baseline.",
    learningResource: { label: "Dive into Deep Learning", url: "https://d2l.ai/" }
  },
  "computer-vision": {
    projectIdea: "Build an image classification demo and document where it performs poorly.",
    learningResource: { label: "PyTorch Computer Vision Tutorials", url: "https://pytorch.org/tutorials/beginner/basics/data_tutorial.html" }
  },
  nlp: {
    projectIdea: "Create a simple text classifier and inspect examples it gets wrong.",
    learningResource: { label: "Hugging Face NLP Course", url: "https://huggingface.co/learn/nlp-course/" }
  },
  robotics: {
    projectIdea: "Simulate a simple robot movement sequence and explain its control logic.",
    learningResource: { label: "ROS Tutorials", url: "https://docs.ros.org/en/jazzy/Tutorials.html" }
  },
  "problem-solving": {
    projectIdea: "Choose a small campus problem, compare three possible solutions, and prototype one.",
    learningResource: { label: "IDEO Design Kit", url: "https://www.designkit.org/methods" }
  },
  programming: {
    projectIdea: "Turn a small idea into a working program with clear input, output, and error handling.",
    learningResource: { label: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/" }
  },
  leadership: {
    projectIdea: "Organize a small team project with clear roles, milestones, and a short retrospective.",
    learningResource: { label: "Atlassian Team Playbook", url: "https://www.atlassian.com/team-playbook" }
  },
  "research-writing": {
    projectIdea: "Write a two-page literature summary with a clear question, evidence, and citations.",
    learningResource: { label: "Purdue OWL: Research and Citation", url: "https://owl.purdue.edu/owl/research_and_citation/resources.html" }
  }
};

function titleForSkill(skillId: string) {
  return skillId
    .split(/[-\s]+/)
    .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1))
    .join(" ");
}

export function getSkillRoadmapResource(skillId: string): SkillRoadmapResource {
  const canonicalId = getCanonicalSkillId(skillId) ?? skillId;
  const resource = SKILL_PROJECT_RESOURCES[canonicalId] ?? {
    projectIdea: `Build a small, well-documented project that demonstrates ${titleForSkill(canonicalId)} in a context you care about.`,
    learningResource: {
      label: `${titleForSkill(canonicalId)} documentation`,
      url: "https://developer.mozilla.org/en-US/docs/Learn_web_development"
    }
  };

  return { skillId: canonicalId, ...resource };
}

export function generateSkillRoadmap(missingSkills: string[]): SkillRoadmapWeek[] {
  const uniqueSkills = [...new Set(missingSkills.map((skill) => getSkillRoadmapResource(skill).skillId))];
  if (uniqueSkills.length === 0) return [];

  const weekCount = Math.min(4, Math.max(2, Math.ceil(uniqueSkills.length / 2) + 1));
  const learningWeeks = Math.ceil(weekCount / 2);
  const splitIntoGroups = (items: string[], groupCount: number) => {
    const groups: string[][] = Array.from({ length: groupCount }, () => []);
    items.forEach((item, index) => {
      groups[Math.floor((index * groupCount) / items.length)].push(item);
    });
    return groups;
  };
  const learningGroups = splitIntoGroups(uniqueSkills, learningWeeks);
  const buildGroups = splitIntoGroups(
    uniqueSkills,
    weekCount - learningWeeks
  );
  const weeks: SkillRoadmapWeek[] = Array.from({ length: weekCount }, (_, index) => ({
    week: index + 1,
    focus:
      index < learningWeeks
        ? "Learn the foundations"
        : "Build, test, and reflect",
    tasks: []
  }));

  learningGroups.forEach((group, index) => {
    weeks[index].tasks.push(
      ...group.map((skillId) => ({
        ...getSkillRoadmapResource(skillId),
        activity: "learn" as const
      }))
    );
  });
  buildGroups.forEach((group, index) => {
    weeks[learningWeeks + index].tasks.push(
      ...group.map((skillId) => ({
        ...getSkillRoadmapResource(skillId),
        activity: "build" as const
      }))
    );
  });

  return weeks;
}
