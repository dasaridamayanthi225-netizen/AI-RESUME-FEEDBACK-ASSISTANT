const SKILLS = [
  "javascript", "python", "java", "c programming", "c++", "sql", "html", "css",
  "node.js", "express.js", "git", "github", "excel", "power bi", "tableau",
  "machine learning", "data analysis", "data visualization", "statistics", "pandas",
  "numpy", "scikit-learn", "communication", "teamwork", "problem solving",
  "leadership", "rest api", "postgresql", "supabase", "linux", "cloud computing"
];

const SECTION_RULES = [
  { key: "contact", label: "Contact details", patterns: [/\bemail\b/i, /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i, /\bphone\b/i, /\blinkedin\b/i, /\bgithub\b/i] },
  { key: "summary", label: "Professional summary", patterns: [/\bsummary\b/i, /\bobjective\b/i, /\bprofile\b/i, /\babout me\b/i] },
  { key: "education", label: "Education", patterns: [/\beducation\b/i, /\bdegree\b/i, /\buniversity\b/i, /\bcollege\b/i, /\bb\.?tech\b/i, /\bbachelor\b/i] },
  { key: "skills", label: "Skills", patterns: [/\bskills\b/i, /\btechnical skills\b/i, /\bprogramming languages\b/i, /\btechnologies\b/i] },
  { key: "projects", label: "Projects", patterns: [/\bprojects?\b/i, /\bdeveloped\b/i, /\bimplemented\b/i, /\bbuilt\b/i] },
  { key: "experience", label: "Experience / activities", patterns: [/\bexperience\b/i, /\binternship\b/i, /\bvolunteer\b/i, /\bextracurricular\b/i, /\bwork history\b/i] }
];

function detectSkills(text) {
  const lower = text.toLowerCase();
  return SKILLS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9+#])${escaped}(?=$|[^a-z0-9+#])`, "i").test(lower);
  });
}

function analyzeResume(resumeText, jobDescription = "") {
  const text = resumeText.trim();
  const sections = SECTION_RULES.map((rule) => ({
    key: rule.key,
    label: rule.label,
    present: rule.patterns.some((pattern) => pattern.test(text))
  }));
  const presentCount = sections.filter((section) => section.present).length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const actionVerbPresent = /\b(developed|built|created|designed|implemented|analyzed|improved|managed|led|automated|organized|tested|delivered|optimized)\b/i.test(text);
  const metricPresent = /\b\d+(?:\.\d+)?\s*(?:%|percent|users|records|hours|days|projects|members|customers|ms|seconds|minutes)\b/i.test(text);
  const resumeSkills = detectSkills(text);
  const jobText = jobDescription.trim();
  const jobSkills = jobText ? detectSkills(jobText) : [];
  const matchedSkills = jobSkills.filter((skill) => resumeSkills.includes(skill));
  const missingSkills = jobSkills.filter((skill) => !resumeSkills.includes(skill));

  // Transparent rubric: sections 60 points, action verbs 15, metrics 15, and useful length 10.
  const score = Math.max(0, Math.min(100,
    Math.round((presentCount / SECTION_RULES.length) * 60) +
    (actionVerbPresent ? 15 : 0) +
    (metricPresent ? 15 : 0) +
    (wordCount >= 100 && wordCount <= 900 ? 10 : wordCount >= 60 && wordCount <= 1100 ? 5 : 0)
  ));
  const strengths = [];
  if (sections.find((s) => s.key === "education")?.present) strengths.push("Education or qualification details appear to be included.");
  if (sections.find((s) => s.key === "skills")?.present && resumeSkills.length) strengths.push(`A skills section and ${resumeSkills.length} recognized skill(s) were detected.`);
  if (sections.find((s) => s.key === "projects")?.present) strengths.push("Project or implementation details appear to be included.");
  if (actionVerbPresent) strengths.push("Action-oriented wording was detected.");
  if (metricPresent) strengths.push("At least one measurable result or quantity was detected.");
  if (!strengths.length) strengths.push("You have a starting draft to improve using the checklist below.");

  const suggestions = [];
  sections.filter((section) => !section.present).forEach((section) => suggestions.push(`Consider adding a clearly labeled ${section.label.toLowerCase()} section if it applies to you.`));
  if (!actionVerbPresent) suggestions.push("Start project and experience bullets with accurate action verbs such as built, tested, analyzed, or improved.");
  if (!metricPresent) suggestions.push("Where truthful, add measurable outcomes (for example, number of records processed or project completion time). Do not invent numbers.");
  if (wordCount < 100) suggestions.push("Your resume text is quite short. Add relevant education, projects, skills, and activities rather than filler.");
  if (wordCount > 900) suggestions.push("Consider removing repeated or less relevant details to make the resume easier to scan.");
  if (jobText && missingSkills.length) suggestions.push(`The job description mentions recognized skills not detected in your resume: ${missingSkills.join(", ")}. Add them only if you genuinely have those skills.`);
  if (jobText && !jobSkills.length) suggestions.push("No skills from the built-in vocabulary were detected in the job description; review it manually for required skills.");
  if (!suggestions.length) suggestions.push("Your resume passed the basic checks. Proofread it and tailor it to each genuine opportunity.");

  return {
    score,
    summary: score >= 80 ? "Many checklist items are present. Review the suggestions and tailor the resume to each role." :
      score >= 55 ? "A useful starting point. Focus on the missing sections and stronger evidence of your work." :
      "Several basic checklist items may be missing. Add relevant details and review the suggestions.",
    sections,
    strengths,
    suggestions,
    resumeSkills,
    jobSkills,
    matchedSkills,
    missingSkills,
    jobDescriptionProvided: Boolean(jobText),
    wordCount,
    rubric: { sections: 60, actionVerbs: 15, measurableResults: 15, usefulLength: 10 }
  };
}

module.exports = { analyzeResume, detectSkills, SKILLS };
