export interface SkillDefinition {
  id: string;
  label: string;
  aliases: string[];
}

export const SKILLS_TAXONOMY: SkillDefinition[] = [
  { id: "python", label: "Python", aliases: ["py", "python3"] },
  { id: "javascript", label: "JavaScript", aliases: ["js", "ecmascript"] },
  { id: "typescript", label: "TypeScript", aliases: ["ts"] },
  { id: "java", label: "Java", aliases: ["jdk"] },
  { id: "cpp", label: "C++", aliases: ["c++", "cpp", "cplusplus"] },
  { id: "c", label: "C", aliases: ["c language"] },
  { id: "sql", label: "SQL", aliases: ["structured query language"] },
  { id: "html-css", label: "HTML & CSS", aliases: ["html", "css", "html5", "css3"] },
  { id: "react", label: "React", aliases: ["react.js", "reactjs"] },
  { id: "nextjs", label: "Next.js", aliases: ["next", "nextjs"] },
  { id: "nodejs", label: "Node.js", aliases: ["node", "nodejs"] },
  { id: "git", label: "Git", aliases: ["github", "version control"] },
  { id: "linux", label: "Linux", aliases: ["unix", "bash"] },
  { id: "data-structures", label: "Data structures", aliases: ["ds", "dsa"] },
  { id: "algorithms", label: "Algorithms", aliases: ["algo", "algorithm design"] },
  { id: "problem-solving", label: "Problem solving", aliases: ["creative problem solving"] },
  { id: "programming", label: "Programming", aliases: ["coding", "software development"] },
  { id: "leadership", label: "Leadership", aliases: ["team leadership", "teamwork"] },
  { id: "machine-learning", label: "Machine learning", aliases: ["ml", "machine learning", "ml engineering"] },
  { id: "deep-learning", label: "Deep learning", aliases: ["dl", "neural networks"] },
  { id: "data-analysis", label: "Data analysis", aliases: ["data analytics", "exploratory data analysis"] },
  { id: "pandas", label: "Pandas", aliases: ["python pandas"] },
  { id: "tensorflow", label: "TensorFlow", aliases: ["tf", "tensorflow"] },
  { id: "pytorch", label: "PyTorch", aliases: ["torch"] },
  { id: "statistics", label: "Statistics", aliases: ["statistical analysis", "stats"] },
  { id: "computer-vision", label: "Computer vision", aliases: ["cv", "image processing"] },
  { id: "nlp", label: "Natural language processing", aliases: ["natural language processing", "text processing"] },
  { id: "cloud", label: "Cloud computing", aliases: ["cloud", "aws", "azure", "gcp"] },
  { id: "docker", label: "Docker", aliases: ["containers", "containerization"] },
  { id: "cybersecurity", label: "Cybersecurity", aliases: ["information security", "infosec"] },
  { id: "ui-ux", label: "UI/UX design", aliases: ["ux", "ui", "user experience", "user interface"] },
  { id: "figma", label: "Figma", aliases: ["figma design"] },
  { id: "communication", label: "Communication", aliases: ["written communication", "presentation"] },
  { id: "research-writing", label: "Research writing", aliases: ["technical writing", "academic writing"] },
  { id: "electronics", label: "Electronics", aliases: ["embedded systems", "circuit design"] },
  { id: "cad", label: "CAD", aliases: ["computer-aided design", "solidworks"] },
  { id: "robotics", label: "Robotics", aliases: ["robotics engineering", "ros"] }
];

export function normalizeSkillQuery(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

export function findSkillByAlias(value: string) {
  const exactQuery = value.trim().toLocaleLowerCase();
  const query = normalizeSkillQuery(value);
  if (!query) return undefined;

  const exactMatch = SKILLS_TAXONOMY.find((skill) =>
    [skill.id, skill.label, ...skill.aliases].some(
      (name) => name.trim().toLocaleLowerCase() === exactQuery
    )
  );
  if (exactMatch) return exactMatch;

  return SKILLS_TAXONOMY.find((skill) =>
    [skill.id, skill.label, ...skill.aliases].some(
      (name) => normalizeSkillQuery(name) === query
    )
  );
}

export function getCanonicalSkillId(value: string) {
  const exactId = value.trim().toLocaleLowerCase();
  return (
    SKILLS_TAXONOMY.find(
      (skill) => skill.id.toLocaleLowerCase() === exactId
    )?.id ?? findSkillByAlias(value)?.id
  );
}

export function searchSkills(value: string) {
  const query = normalizeSkillQuery(value);
  if (!query) return SKILLS_TAXONOMY;

  const exactMatch = findSkillByAlias(value);
  return SKILLS_TAXONOMY.filter((skill) => {
    if (skill.id === exactMatch?.id) return true;
    return [skill.id, skill.label, ...skill.aliases].some((name) =>
      normalizeSkillQuery(name).includes(query)
    );
  });
}

function aliasPattern(alias: string) {
  const tokens = alias.toLocaleLowerCase().match(/[a-z0-9]+/g);
  if (!tokens?.length) return null;

  const body = tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[^a-z0-9]*");
  const cPlusPlusGuard = alias.toLocaleLowerCase().trim() === "c" ? "(?!\\+\\+)" : "";
  return new RegExp(`(?:^|[^a-z0-9])${body}${cPlusPlusGuard}(?:$|[^a-z0-9])`, "i");
}

export function detectSkillsInText(text: string) {
  return SKILLS_TAXONOMY.filter((skill) =>
    [skill.label, ...skill.aliases].some((alias) =>
      aliasPattern(alias)?.test(text)
    )
  );
}
