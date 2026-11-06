const test = require("node:test");
const assert = require("node:assert/strict");
const { analyzeResume, detectSkills } = require("./analyzer");

test("detectSkills recognizes known skills without case sensitivity", () => {
  assert.deepEqual(detectSkills("I use JavaScript, SQL and Python."), ["javascript", "python", "sql"]);
});

test("analyzeResume returns a bounded score and all required sections", () => {
  const result = analyzeResume("Education: B.Tech College. Skills: Python SQL. Projects: Built a data dashboard. Email: student@example.com");
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.equal(result.sections.length, 6);
  assert.equal(result.sections.find((item) => item.key === "education").present, true);
});

test("job skill comparison reports matched and missing recognized skills", () => {
  const result = analyzeResume("Skills: Python and SQL. Education: B.Tech", "Required: Python, SQL, JavaScript");
  assert.ok(result.matchedSkills.includes("python"));
  assert.ok(result.missingSkills.includes("javascript"));
});

test("empty job description is marked as not provided", () => {
  const result = analyzeResume("A".repeat(100));
  assert.equal(result.jobDescriptionProvided, false);
  assert.deepEqual(result.jobSkills, []);
});
