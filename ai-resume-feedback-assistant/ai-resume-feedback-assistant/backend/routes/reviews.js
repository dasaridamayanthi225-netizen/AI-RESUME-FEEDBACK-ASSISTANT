const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { analyzeResume } = require("../utils/analyzer");

const router = express.Router();
router.use(requireAuth);

function publicReview(row) {
  return {
    id: row.id,
    title: row.title,
    score: row.score,
    result: row.result,
    created_at: row.created_at
  };
}

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await req.supabase.from("resume_reviews")
      .select("id,title,score,result,created_at")
      .order("created_at", { ascending: false }).limit(50);
    if (error) return next(error);
    return res.json({ reviews: (data || []).map(publicReview) });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  const resumeText = typeof req.body?.resumeText === "string" ? req.body.resumeText.trim() : "";
  const jobDescription = typeof req.body?.jobDescription === "string" ? req.body.jobDescription.trim() : "";
  if (resumeText.length < 80 || resumeText.length > 12000) return res.status(400).json({ error: "Resume text must be between 80 and 12,000 characters." });
  if (jobDescription.length > 8000) return res.status(400).json({ error: "Job description must be 8,000 characters or fewer." });
  try {
    const result = analyzeResume(resumeText, jobDescription);
    const title = (resumeText.match(/(?:name\s*:\s*)([^\n\r]+)/i)?.[1] || "Resume review").trim().slice(0, 80) || "Resume review";
    const { data, error } = await req.supabase.from("resume_reviews")
      .insert({ user_id: req.user.id, title, resume_text: resumeText, job_description: jobDescription || null, score: result.score, result })
      .select("id,title,score,result,created_at").single();
    if (error) return next(error);
    return res.status(201).json({ review: publicReview(data) });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await req.supabase.from("resume_reviews")
      .select("id,title,score,result,created_at").eq("id", req.params.id).maybeSingle();
    if (error) return next(error);
    if (!data) return res.status(404).json({ error: "Review not found." });
    return res.json({ review: publicReview(data) });
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { data, error } = await req.supabase.from("resume_reviews").delete()
      .eq("id", req.params.id).select("id").maybeSingle();
    if (error) return next(error);
    if (!data) return res.status(404).json({ error: "Review not found or you do not have permission to delete it." });
    return res.json({ message: "Review deleted." });
  } catch (error) { next(error); }
});

module.exports = router;
