const express = require("express");
const { createPublicClient } = require("../supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function validCredentials(email, password) {
  return typeof email === "string" && email.trim().length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    typeof password === "string" && password.length >= 8 && password.length <= 128;
}

router.post("/register", async (req, res, next) => {
  const { email, password } = req.body || {};
  if (!validCredentials(email, password)) return res.status(400).json({ error: "Enter a valid email and a password between 8 and 128 characters." });
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({
      accessToken: data.session?.access_token || null,
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      confirmationRequired: !data.session
    });
  } catch (error) { next(error); }
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body || {};
  if (!validCredentials(email, password)) return res.status(400).json({ error: "Enter a valid email and a password between 8 and 128 characters." });
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.session) return res.status(401).json({ error: "Email or password is incorrect, or email confirmation is required." });
    return res.json({ accessToken: data.session.access_token, user: { id: data.user.id, email: data.user.email } });
  } catch (error) { next(error); }
});

router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));

module.exports = router;
