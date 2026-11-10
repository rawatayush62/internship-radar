"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileText,
  Plus,
  Trash2,
  Upload,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext
} from "react-hook-form";
import { PROFILE_INTEREST_TYPES, profileSchema } from "@/lib/profile-schema";
import type {
  ProfileFormInput,
  ProfileFormOutput
} from "@/lib/profile-schema";
import { useProfileStore } from "@/lib/profile-store";
import { useTrackerStore } from "@/lib/tracker-store";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  detectSkillsInText,
  findSkillByAlias,
  searchSkills,
  SKILLS_TAXONOMY
} from "@/lib/skills";
import { extractPdfText } from "@/lib/resume-pdf";
import type {
  OpportunityType,
  Profile,
  ProfileAcademicYear,
  SkillLevel
} from "@/types/opportunity";

const branches = [
  "Computer Science",
  "Computer Engineering",
  "Information Technology",
  "Electrical Engineering",
  "Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Engineering",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Science",
  "Business",
  "Design",
  "Other"
];

const locationOptions = [
  "Remote",
  "India",
  "United States",
  "Canada",
  "United Kingdom",
  "Europe",
  "Germany",
  "Global"
];

const opportunityLabels: Record<
  (typeof PROFILE_INTEREST_TYPES)[number],
  string
> = {
  internship: "Internship",
  hackathon: "Hackathon",
  research: "Research",
  scholarship: "Scholarship",
  competition: "Competition"
};

const skillLevels: SkillLevel[] = [
  "beginner",
  "intermediate",
  "advanced"
];

const steps = [
  { title: "About you", description: "Year of study and branch", optional: false },
  { title: "Preferences", description: "Locations and opportunity types", optional: false },
  { title: "Skills", description: "Skills and experience levels", optional: true },
  { title: "Projects & interests", description: "What you have worked on", optional: true }
] as const;

const fieldsByStep: (keyof ProfileFormInput)[][] = [
  ["academic_year", "branch"],
  ["preferred_locations", "remote_is_fine", "opportunity_types"],
  ["skills"],
  ["projects", "interests"]
] as const;

function createEmptyProfile(): ProfileFormInput {
  return {
    academic_year: 0,
    branch: "",
    preferred_locations: [],
    remote_is_fine: true,
    opportunity_types: [],
    skills: [],
    projects: [],
    interests: []
  };
}

function profileToForm(profile: Profile | null): ProfileFormInput {
  if (!profile) return createEmptyProfile();

  return {
    academic_year: profile.academic_year,
    branch: profile.branch,
    preferred_locations: profile.preferred_locations ?? [],
    remote_is_fine: profile.remote_is_fine ?? false,
    opportunity_types: profile.opportunity_types.filter(
      (type): type is (typeof PROFILE_INTEREST_TYPES)[number] =>
        PROFILE_INTEREST_TYPES.includes(
          type as (typeof PROFILE_INTEREST_TYPES)[number]
        )
    ),
    skills: profile.skills ?? [],
    projects: (profile.projects ?? []).map((project) => ({
      title: project.title,
      tech_used: project.tech_used.join(", ")
    })),
    interests: profile.interests ?? []
  };
}

function FieldError({ name }: { name: string }) {
  const {
    formState: { errors }
  } = useFormContext<ProfileFormInput>();
  const segments = name.split(".");
  let error: unknown = errors;
  for (const segment of segments) {
    if (typeof error !== "object" || error === null) break;
    error = (error as Record<string, unknown>)[segment];
  }
  if (typeof error !== "object" || error === null || !("message" in error)) {
    return null;
  }
  const message = (error as { message?: unknown }).message;
  if (typeof message !== "string") return null;

  return (
    <p className="mt-1 text-sm text-red-700" id={`${name}-error`} role="alert">
      {message}
    </p>
  );
}

function SkillPicker() {
  const { getValues, setValue, watch } = useFormContext<ProfileFormInput>();
  const selectedSkills = watch("skills");
  const [query, setQuery] = useState("");
  const [detectedSkillIds, setDetectedSkillIds] = useState<string[]>([]);
  const [resumeStatus, setResumeStatus] = useState<{
    kind: "success" | "info" | "error";
    message: string;
  } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const suggestions = searchSkills(query);
  const exactMatch = findSkillByAlias(query);

  function addSkill(skillId: string) {
    const currentSkills = getValues("skills");
    if (currentSkills.some((skill) => skill.id === skillId)) return;
    setValue(
      "skills",
      [...currentSkills, { id: skillId, level: "beginner" }],
      { shouldDirty: true, shouldValidate: true }
    );
    setQuery("");
  }

  function updateLevel(skillId: string, level: SkillLevel) {
    setValue(
      "skills",
      selectedSkills.map((skill) =>
        skill.id === skillId ? { ...skill, level } : skill
      ),
      { shouldDirty: true, shouldValidate: true }
    );
  }

  function removeSkill(skillId: string) {
    setDetectedSkillIds((current) => current.filter((id) => id !== skillId));
    setValue(
      "skills",
      selectedSkills.filter((skill) => skill.id !== skillId),
      { shouldDirty: true, shouldValidate: true }
    );
  }

  async function handleResumeUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (
      !file.name.toLocaleLowerCase().endsWith(".pdf") ||
      (file.type && file.type !== "application/pdf")
    ) {
      setResumeStatus({
        kind: "error",
        message: "Choose a PDF file to scan for skills."
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setResumeStatus({
        kind: "error",
        message: "This PDF is larger than 10 MB. Choose a smaller file."
      });
      return;
    }

    setIsExtracting(true);
    setResumeStatus(null);
    try {
      const { text, pageCount } = await extractPdfText(file);
      if (!text) {
        setDetectedSkillIds([]);
        setResumeStatus({
          kind: "info",
          message:
            "This PDF has no extractable text. It may be scanned or image-only; OCR is not supported. You can still add skills manually."
        });
        return;
      }

      const detectedSkills = detectSkillsInText(text);
      const detectedIds = detectedSkills.map((skill) => skill.id);
      setDetectedSkillIds(detectedIds);
      setValue(
        "skills",
        (() => {
          const currentSkills = getValues("skills");
          const currentIds = new Set(currentSkills.map((skill) => skill.id));
          return [
            ...currentSkills,
            ...detectedIds
              .filter((id) => !currentIds.has(id))
              .map((id) => ({ id, level: "beginner" as const }))
          ];
        })(),
        { shouldDirty: true, shouldValidate: true }
      );
      setResumeStatus({
        kind: detectedSkills.length > 0 ? "success" : "info",
        message:
          detectedSkills.length > 0
            ? `Scanned ${pageCount} ${
                pageCount === 1 ? "page" : "pages"
              } and found ${detectedSkills.length} ${
                detectedSkills.length === 1 ? "skill" : "skills"
              }. Review and edit the detected skills below.`
            : "Text was extracted, but no skills from the taxonomy were detected. You can add skills manually."
      });
    } catch (error) {
      const reason =
        error instanceof Error && error.name === "PasswordException"
          ? "This PDF is password-protected. Unlock it and try again."
          : "This PDF could not be read. Check that it is a valid, unprotected PDF and try again.";
      setDetectedSkillIds([]);
      setResumeStatus({ kind: "error", message: reason });
    } finally {
      setIsExtracting(false);
    }
  }

  const selectedIds = new Set(selectedSkills.map((skill) => skill.id));

  return (
    <div>
      <label
        className="mb-2 block text-sm font-semibold text-slate-800"
        htmlFor="skill-search"
      >
        Add skills
      </label>
      <p className="mb-3 text-sm leading-6 text-slate-600">
        Search by skill name or alias. For example, &quot;ReactJS&quot; selects
        React.
      </p>
      <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary">
            <FileText aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">
              Find skills in your resume
            </p>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Select a PDF to detect skills from its text. Your file is read in
              this browser and is never uploaded or saved.
            </p>
            <label
              className={`mt-3 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-ring ${
                isExtracting ? "pointer-events-none opacity-60" : ""
              }`}
              htmlFor="resume-upload"
            >
              <Upload aria-hidden="true" className="size-4" />
              {isExtracting ? "Reading PDF..." : "Choose PDF"}
              <input
                accept="application/pdf,.pdf"
                className="sr-only"
                disabled={isExtracting}
                id="resume-upload"
                onChange={handleResumeUpload}
                type="file"
              />
            </label>
            <p className="mt-2 text-xs text-slate-500">
              PDF only · Up to 10 MB · Scanned/image-only PDFs are not
              supported
            </p>
          </div>
        </div>
        {isExtracting && (
          <p aria-live="polite" className="mt-3 text-sm text-slate-600" role="status">
            Extracting text from your resume…
          </p>
        )}
        {resumeStatus && (
          <p
            aria-live="polite"
            className={`mt-3 text-sm leading-5 ${
              resumeStatus.kind === "error"
                ? "text-red-800"
                : resumeStatus.kind === "success"
                  ? "text-green-800"
                  : "text-amber-900"
            }`}
            role={resumeStatus.kind === "error" ? "alert" : "status"}
          >
            {resumeStatus.message}
          </p>
        )}
      </div>
      <input
        autoComplete="off"
        className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        id="skill-search"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search skills (e.g. ReactJS)"
        type="search"
        value={query}
      />
      {query.trim() && (
        <ul
          className="mt-2 max-h-48 overflow-auto rounded-lg border bg-white p-1 shadow-sm"
          aria-label="Skill suggestions"
        >
          {suggestions.length > 0 ? (
            suggestions.slice(0, 8).map((skill) => {
              const isSelected = selectedIds.has(skill.id);
              return (
                <li key={skill.id}>
                  <button
                    className="flex min-h-10 w-full items-center justify-between rounded-md px-3 text-left text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSelected}
                    onClick={() => addSkill(skill.id)}
                    type="button"
                  >
                    {skill.label}
                    {isSelected && <Check aria-hidden="true" className="size-4" />}
                  </button>
                </li>
              );
            })
          ) : (
            <li className="px-3 py-2 text-sm text-slate-500">
              No matching skills in the taxonomy.
            </li>
          )}
        </ul>
      )}
      {exactMatch && !selectedIds.has(exactMatch.id) && (
        <p className="mt-2 text-xs text-slate-500" aria-live="polite">
          Alias recognized as {exactMatch.label}.
        </p>
      )}

      <ul className="mt-4 space-y-2" aria-label="Selected skills">
        {selectedSkills.map((skill) => {
          const definition = SKILLS_TAXONOMY.find(
            (candidate) => candidate.id === skill.id
          );
          if (!definition) return null;

          return (
            <li
              className="flex flex-wrap items-center gap-2 rounded-xl border bg-slate-50 p-2.5 sm:flex-nowrap"
              key={skill.id}
            >
              <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">
                {definition.label}
                {detectedSkillIds.includes(skill.id) && (
                  <span className="ml-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 align-middle text-[11px] font-medium text-blue-800">
                    Resume
                  </span>
                )}
              </span>
              <label className="sr-only" htmlFor={`level-${skill.id}`}>
                {definition.label} skill level
              </label>
              <select
                className="h-9 rounded-lg border bg-white px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                id={`level-${skill.id}`}
                onChange={(event) =>
                  updateLevel(skill.id, event.target.value as SkillLevel)
                }
                value={skill.level}
              >
                {skillLevels.map((level) => (
                  <option key={level} value={level}>
                    {level[0].toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
              <button
                aria-label={`Remove ${definition.label}`}
                className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => removeSkill(skill.id)}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
      <FieldError name="skills" />

    </div>
  );
}

function ProfileFormFields({ step }: { step: number }) {
  const {
    register,
    setValue,
    watch,
    getValues,
    control,
    formState: { errors }
  } = useFormContext<ProfileFormInput>();
  const locations = watch("preferred_locations");
  const selectedTypes = watch("opportunity_types");
  const interests = watch("interests");
  const [locationInput, setLocationInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const {
    fields: projectFields,
    append: appendProject,
    remove: removeProject
  } = useFieldArray({ control, name: "projects" });

  function toggleLocation(location: string) {
    const current = getValues("preferred_locations");
    setValue(
      "preferred_locations",
      current.includes(location)
        ? current.filter((value) => value !== location)
        : [...current, location],
      { shouldDirty: true, shouldValidate: true }
    );
  }

  function addLocation() {
    const location = locationInput.trim();
    if (!location) return;
    const current = getValues("preferred_locations");
    if (!current.some((value) => value.toLowerCase() === location.toLowerCase())) {
      setValue("preferred_locations", [...current, location], {
        shouldDirty: true,
        shouldValidate: true
      });
    }
    setLocationInput("");
  }

  function toggleType(type: ProfileFormInput["opportunity_types"][number]) {
    const current = getValues("opportunity_types");
    const next = current.includes(type)
      ? current.filter((value) => value !== type)
      : [...current, type];
    setValue("opportunity_types", next, {
      shouldDirty: true,
      shouldValidate: true
    });
  }

  function addInterest() {
    const interest = interestInput.trim();
    if (!interest) return;
    if (
      !getValues("interests").some(
        (value) => value.toLowerCase() === interest.toLowerCase()
      )
    ) {
      setValue("interests", [...getValues("interests"), interest], {
        shouldDirty: true,
        shouldValidate: true
      });
    }
    setInterestInput("");
  }

  if (step === 0) {
    return (
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            className="mb-2 block text-sm font-semibold text-slate-800"
            htmlFor="academic-year"
          >
            Year of study
          </label>
          <select
            aria-describedby={errors.academic_year ? "academic_year-error" : undefined}
            aria-invalid={Boolean(errors.academic_year)}
            className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            id="academic-year"
            {...register("academic_year", { valueAsNumber: true })}
          >
            <option value={0}>Select your year</option>
            {[1, 2, 3, 4].map((year) => (
              <option key={year} value={year}>
                Year {year}
              </option>
            ))}
          </select>
          <FieldError name="academic_year" />
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-semibold text-slate-800"
            htmlFor="branch"
          >
            Branch / field of study
          </label>
          <select
            aria-describedby={errors.branch ? "branch-error" : undefined}
            aria-invalid={Boolean(errors.branch)}
            className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            id="branch"
            {...register("branch")}
          >
            <option value="">Select your branch</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <FieldError name="branch" />
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="space-y-7">
        <fieldset>
          <legend className="text-sm font-semibold text-slate-800">
            Preferred locations
          </legend>
          <p className="mt-1 text-sm text-slate-600">
            Choose one or more regions. This is optional.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {locationOptions.map((location) => (
              <label
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm text-slate-700 hover:bg-slate-50 has-[:checked]:border-blue-300 has-[:checked]:bg-blue-50"
                key={location}
              >
                <input
                  checked={locations.includes(location)}
                  className="size-4 accent-blue-600"
                  onChange={() => toggleLocation(location)}
                  type="checkbox"
                />
                {location}
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <label className="sr-only" htmlFor="custom-location">
              Add another location
            </label>
            <input
              className="h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="custom-location"
              onChange={(event) => setLocationInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addLocation();
                }
              }}
              placeholder="Add another location"
              value={locationInput}
            />
            <button
              className="inline-flex h-10 items-center gap-1 rounded-lg border px-3 text-sm font-medium hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={addLocation}
              type="button"
            >
              <Plus aria-hidden="true" className="size-4" />
              Add
            </button>
          </div>
          {locations.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Selected locations">
              {locations.map((location) => (
                <li
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-xs font-medium text-slate-700"
                  key={location}
                >
                  {location}
                  <button
                    aria-label={`Remove ${location}`}
                    className="inline-flex size-6 items-center justify-center rounded-full hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => toggleLocation(location)}
                    type="button"
                  >
                    <X aria-hidden="true" className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <FieldError name="preferred_locations" />
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-800">
            Work arrangement
          </legend>
          <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border p-4 hover:bg-slate-50">
            <input
              className="mt-0.5 size-4 accent-blue-600"
              type="checkbox"
              {...register("remote_is_fine")}
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">
                Remote is fine
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                Include opportunities that can be done remotely.
              </span>
            </span>
          </label>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-800">
            Opportunity types
          </legend>
          <p className="mt-1 text-sm text-slate-600">
            Select all the kinds of opportunities you want to explore.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {PROFILE_INTEREST_TYPES.map((type) => (
              <label
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 has-[:checked]:border-blue-300 has-[:checked]:bg-blue-50"
                key={type}
              >
                <input
                  checked={selectedTypes.includes(type)}
                  className="size-4 accent-blue-600"
                  onChange={() => toggleType(type)}
                  type="checkbox"
                />
                {opportunityLabels[type]}
              </label>
            ))}
          </div>
          <FieldError name="opportunity_types" />
        </fieldset>
      </div>
    );
  }

  if (step === 2) {
    return <SkillPicker />;
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Projects</h3>
            <p className="mt-1 text-sm text-slate-600">
              Add a few projects and the technologies you used.
            </p>
          </div>
          <button
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border px-3 text-sm font-medium hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            disabled={projectFields.length >= 10}
            onClick={() => appendProject({ title: "", tech_used: "" })}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add project
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {projectFields.map((project, index) => (
            <fieldset
              className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_1fr_auto]"
              key={project.id}
            >
              <legend className="sr-only">Project {index + 1}</legend>
              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                  htmlFor={`project-${index}-title`}
                >
                  Project title
                </label>
                <input
                  aria-describedby={
                    errors.projects?.[index]?.title
                      ? `projects.${index}.title-error`
                      : undefined
                  }
                  aria-invalid={Boolean(errors.projects?.[index]?.title)}
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  id={`project-${index}-title`}
                  {...register(`projects.${index}.title`)}
                />
                <FieldError name={`projects.${index}.title`} />
              </div>
              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                  htmlFor={`project-${index}-tech`}
                >
                  Technologies (comma-separated)
                </label>
                <input
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  id={`project-${index}-tech`}
                  placeholder="React, Python, Figma"
                  {...register(`projects.${index}.tech_used`)}
                />
              </div>
              <button
                aria-label={`Remove project ${index + 1}`}
                className="mt-5 inline-flex size-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => removeProject(index)}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </fieldset>
          ))}
          <FieldError name="projects" />
          {projectFields.length === 0 && (
            <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-slate-500">
              Projects are optional. Add one whenever you are ready.
            </p>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-800">Interests</h3>
        <p className="mt-1 text-sm text-slate-600">
          Add topics you are excited about, like climate tech or accessibility.
        </p>
        <div className="mt-3 flex gap-2">
          <label className="sr-only" htmlFor="interest-input">
            Add an interest tag
          </label>
          <input
            className="h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            id="interest-input"
            onChange={(event) => setInterestInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addInterest();
              }
            }}
            placeholder="Type an interest and press Enter"
            value={interestInput}
          />
          <button
            className="inline-flex h-10 items-center gap-1 rounded-lg border px-3 text-sm font-medium hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={addInterest}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add
          </button>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Interest tags">
          {interests.map((interest) => (
            <li
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1 text-xs font-medium text-blue-800"
              key={interest}
            >
              {interest}
              <button
                aria-label={`Remove ${interest}`}
                className="inline-flex size-6 items-center justify-center rounded-full hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() =>
                  setValue(
                    "interests",
                    getValues("interests").filter((tag) => tag !== interest),
                    { shouldDirty: true, shouldValidate: true }
                  )
                }
                type="button"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <FieldError name="interests" />
      </section>
    </div>
  );
}

export function ProfileForm({ mode }: { mode: "onboarding" | "edit" }) {
  const router = useRouter();
  const profile = useProfileStore((state) => state.profile);
  const hasHydrated = useProfileStore((state) => state.hasHydrated);
  const saveProfile = useProfileStore((state) => state.saveProfile);
  const resetProfile = useProfileStore((state) => state.resetProfile);
  const clearTracker = useTrackerStore((state) => state.clearTracker);
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const form = useForm<ProfileFormInput, unknown, ProfileFormOutput>({
    resolver: zodResolver(profileSchema),
    defaultValues: createEmptyProfile(),
    mode: "onTouched"
  });
  const { handleSubmit, reset, trigger, formState } = form;

  useEffect(() => {
    if (hasHydrated) reset(profileToForm(profile));
  }, [hasHydrated, profile, reset]);

  async function goNext() {
    const valid = await trigger(fieldsByStep[step], { shouldFocus: true });
    if (valid) setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function save(values: ProfileFormOutput) {
    setSubmitError("");
    try {
      const profileToSave: Profile = {
        ...values,
        opportunity_types: values.opportunity_types as OpportunityType[],
        academic_year: values.academic_year as ProfileAcademicYear
      };
      saveProfile(profileToSave);
      router.push("/?sort=recommended");
    } catch {
      setSubmitError(
        "Your profile could not be saved. Please try again."
      );
    }
  }

  function exportProfile() {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "internship-radar-profile.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function resetMyData() {
    if (
      !window.confirm(
        "Reset your saved profile and all tracked opportunities on this device? This cannot be undone."
      )
    ) {
      return;
    }
    resetProfile();
    clearTracker();
    router.replace("/onboarding");
  }

  if (!hasHydrated) {
    return (
      <main
        aria-label="Loading profile"
        className="mx-auto min-h-screen max-w-3xl px-5 py-12 sm:px-8"
        role="status"
      >
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-white" />
        <span className="sr-only">Loading your saved profile...</span>
      </main>
    );
  }

  if (mode === "edit" && !profile) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-5 py-6 sm:px-8 sm:py-10">
        <header className="flex items-center justify-between gap-3">
          <Link
            className="flex items-center text-sm font-bold tracking-tight text-slate-950"
            href="/"
          >
            <span className="mr-2 inline-flex size-8 items-center justify-center rounded-xl bg-blue-700 text-white">
              IR
            </span>
            Internship Radar
          </Link>
          <ThemeToggle />
        </header>
        <section className="mt-16 rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-10">
          <h1 className="text-2xl font-semibold text-slate-950">
            Your profile is not set up yet
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
            Add your study details, interests, and skills to personalize the
            opportunity feed.
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href="/onboarding"
          >
            Start profile onboarding
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-6 sm:px-8 sm:py-10">
      <header className="flex items-center justify-between gap-3">
        <Link
          className="flex items-center text-sm font-bold tracking-tight text-slate-950"
          href="/"
        >
          <span className="mr-2 inline-flex size-8 items-center justify-center rounded-xl bg-blue-700 text-white">
            IR
          </span>
          Internship Radar
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          {mode === "onboarding" && profile && (
            <Link
              className="text-sm font-medium text-primary hover:underline"
              href="/profile"
            >
              Edit saved profile
            </Link>
          )}
          <ThemeToggle />
        </div>
      </header>

      <section className="pb-6 pt-10 sm:pt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {mode === "onboarding" ? "Your opportunity profile" : "Profile settings"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {mode === "onboarding" ? "Tell us what fits you." : "Your profile"}
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          {mode === "onboarding"
            ? "A few details help us put relevant opportunities first. You can update these any time."
            : "Update your details and preferences to keep recommendations relevant."}
        </p>
      </section>

      {mode === "edit" && profile && (
        <section
          aria-label="Profile data tools"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
        >
          <p className="text-sm text-slate-600">
            Your profile and tracker are stored only in this browser.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold text-slate-700 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={exportProfile}
              type="button"
            >
              <Download aria-hidden="true" className="size-4" />
              Export profile as JSON
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-800 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950"
              onClick={resetMyData}
              type="button"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Reset my data
            </button>
          </div>
        </section>
      )}

      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-800">
            Step {step + 1} of {steps.length}
            <span className="font-normal text-slate-500">
              {" "}
              · {steps[step].title}
              {steps[step].optional ? " · optional" : ""}
            </span>
          </p>
          <p className="text-xs text-slate-500">
            {Math.round(((step + 1) / steps.length) * 100)}% complete
          </p>
        </div>
        <ol
          aria-label="Profile setup progress"
          className="grid grid-cols-4 gap-2"
        >
          {steps.map((item, index) => (
            <li key={item.title}>
              <button
                aria-current={step === index ? "step" : undefined}
                aria-label={`Step ${index + 1}: ${item.title}${
                  item.optional ? ", optional" : ""
                }`}
                className={`h-2 w-full rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  index <= step ? "bg-primary" : "bg-slate-200"
                }`}
                disabled={index > step}
                onClick={() => setStep(index)}
                type="button"
              />
            </li>
          ))}
        </ol>
        <p className="sr-only" aria-live="polite">
          Step {step + 1} of {steps.length}: {steps[step].title}
        </p>
      </div>

      <FormProvider {...form}>
        <form
          className="rounded-2xl border bg-white p-5 shadow-sm sm:p-8"
          noValidate
          onSubmit={handleSubmit(save)}
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-950">
              {steps[step].title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {steps[step].description}
            </p>
          </div>

          <ProfileFormFields step={step} />

          {submitError && (
            <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {submitError}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <button
              className="inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
              disabled={step === 0 || formState.isSubmitting}
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              type="button"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back
            </button>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              {steps[step].optional && step < steps.length - 1 && (
                <button
                  className="h-11 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setStep((current) => current + 1)}
                  type="button"
                >
                  Skip this step
                </button>
              )}
              {step < steps.length - 1 ? (
                <button
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={goNext}
                  type="button"
                >
                  Next
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
              ) : (
                <>
                  {steps[step].optional && (
                    <button
                      className="h-11 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => handleSubmit(save)()}
                      type="button"
                    >
                      Skip and save
                    </button>
                  )}
                  <button
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={formState.isSubmitting}
                    type="submit"
                  >
                    {formState.isSubmitting ? "Saving..." : "Save profile"}
                    {!formState.isSubmitting && (
                      <Check aria-hidden="true" className="size-4" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </FormProvider>

      {mode === "edit" && !profile && (
        <p className="mt-4 text-center text-sm text-slate-600">
          No saved profile yet. You can start with{" "}
          <Link className="font-semibold text-primary hover:underline" href="/onboarding">
            onboarding
          </Link>
          .
        </p>
      )}
    </main>
  );
}
